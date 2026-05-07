import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { RewardType } from '../rewards/reward.model';
import { RewardsService } from '../rewards/rewards.service';
import { StorageService } from '../storage/storage.service';
import { TasksService } from '../tasks/tasks.service';
import { Submission, SubmissionStatus, PhotoUploadTarget } from './submission.model';
import {
  SubmitPhotoTaskInput,
  SubmitQuizTaskInput,
  SubmitTimerTaskInput,
} from './submission.input';

const COLLECTION = 'submissions';
const QUIZ_PASS_THRESHOLD = 80;

@Injectable()
export class SubmissionsService {
  private readonly logger = new Logger(SubmissionsService.name);

  constructor(
    private readonly firebase: FirebaseService,
    private readonly storage: StorageService,
    private readonly tasks: TasksService,
    private readonly rewards: RewardsService,
  ) {}

  private get col() {
    return this.firebase.firestore.collection(COLLECTION);
  }

  async requestPhotoUpload(
    childUid: string,
    familyId: string,
    taskId: string,
  ): Promise<PhotoUploadTarget> {
    const storagePath = `submissions/${familyId}/${taskId}/${childUid}-${Date.now()}.jpg`;
    const uploadUrl = await this.storage.getUploadUrl(storagePath);
    return { storagePath, uploadUrl, contentType: 'image/jpeg' };
  }

  private async createBase(
    childUid: string,
    familyId: string,
    taskId: string,
    chosenReward: RewardType,
    extra: Partial<Omit<Submission, 'id'>>,
  ): Promise<Submission> {
    // Verify task belongs to family
    const task = await this.tasks.findOne(taskId);
    if (task.familyId && task.familyId !== familyId) {
      throw new BadRequestException('Task not in this family');
    }

    const data: Omit<Submission, 'id'> = {
      taskId,
      childUid,
      familyId,
      chosenReward,
      status: SubmissionStatus.PENDING,
      submittedAt: new Date().toISOString(),
      ...extra,
    };
    const ref = await this.col.add(data);
    const snap = await ref.get();
    return { id: snap.id, ...snap.data() } as Submission;
  }

  async submitPhoto(
    childUid: string,
    familyId: string,
    input: SubmitPhotoTaskInput,
  ): Promise<Submission> {
    if (!(await this.storage.exists(input.photoStoragePath))) {
      throw new BadRequestException(
        'Photo not found at storage path — upload first',
      );
    }
    return this.createBase(childUid, familyId, input.taskId, input.chosenReward, {
      photoStoragePath: input.photoStoragePath,
    });
  }

  async submitTimer(
    childUid: string,
    familyId: string,
    input: SubmitTimerTaskInput,
  ): Promise<Submission> {
    return this.createBase(childUid, familyId, input.taskId, input.chosenReward, {
      timerSeconds: input.timerSeconds,
    });
  }

  /**
   * Quiz auto-approves if score ≥ threshold; otherwise rejected immediately.
   * No parent review needed.
   */
  async submitQuiz(
    childUid: string,
    familyId: string,
    input: SubmitQuizTaskInput,
  ): Promise<Submission> {
    const passed = input.quizScore >= QUIZ_PASS_THRESHOLD;
    const submission = await this.createBase(
      childUid,
      familyId,
      input.taskId,
      input.chosenReward,
      { quizScore: input.quizScore },
    );

    if (passed) {
      return this.approve(submission.id, childUid, /* autoApprove */ true);
    } else {
      return this.reject(
        submission.id,
        childUid,
        `Score ${input.quizScore.toFixed(0)}% below pass threshold ${QUIZ_PASS_THRESHOLD}%`,
        true,
      );
    }
  }

  async findOne(id: string): Promise<Submission> {
    const doc = await this.col.doc(id).get();
    if (!doc.exists) throw new NotFoundException(`Submission ${id} not found`);
    return this.withSignedUrl({ id: doc.id, ...doc.data() } as Submission);
  }

  async listForFamily(
    familyId: string,
    status?: SubmissionStatus,
  ): Promise<Submission[]> {
    let query: FirebaseFirestore.Query = this.col.where(
      'familyId',
      '==',
      familyId,
    );
    if (status) query = query.where('status', '==', status);
    const snap = await query.limit(200).get();
    const list = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }) as Submission)
      .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))
      .slice(0, 100);
    return Promise.all(list.map((s) => this.withSignedUrl(s)));
  }

  async listForChild(childUid: string): Promise<Submission[]> {
    const snap = await this.col
      .where('childUid', '==', childUid)
      .limit(200)
      .get();
    const list = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }) as Submission)
      .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))
      .slice(0, 100);
    return Promise.all(list.map((s) => this.withSignedUrl(s)));
  }

  private async withSignedUrl(s: Submission): Promise<Submission> {
    if (s.photoStoragePath) {
      try {
        s.photoDownloadUrl = await this.storage.getReadUrl(s.photoStoragePath);
      } catch (e) {
        this.logger.warn(`Failed to sign URL for ${s.photoStoragePath}: ${(e as Error).message}`);
      }
    }
    return s;
  }

  async approve(
    id: string,
    reviewerUid: string,
    autoApprove = false,
  ): Promise<Submission> {
    const ref = this.col.doc(id);
    const doc = await ref.get();
    if (!doc.exists) throw new NotFoundException('Submission not found');
    const submission = { id: doc.id, ...doc.data() } as Submission;
    if (submission.status !== SubmissionStatus.PENDING) {
      throw new BadRequestException(`Already ${submission.status}`);
    }

    const task = await this.tasks.findOne(submission.taskId);
    const amount = this.amountForReward(task.rewards, submission.chosenReward);
    const durationMinutes =
      submission.chosenReward === RewardType.SCREEN_TIME
        ? task.rewards.screenTimeMin
        : undefined;

    const reward = await this.rewards.issue({
      childUid: submission.childUid,
      familyId: submission.familyId,
      taskId: submission.taskId,
      submissionId: submission.id,
      type: submission.chosenReward,
      amount,
      durationMinutes,
    });

    await ref.update({
      status: SubmissionStatus.APPROVED,
      reviewedAt: new Date().toISOString(),
      reviewerUid: autoApprove ? 'system:auto-quiz' : reviewerUid,
      rewardId: reward.id,
    });
    this.logger.log(
      `Approved submission ${id} → reward ${reward.id} (${reward.type} ${reward.amount})`,
    );
    return this.findOne(id);
  }

  async reject(
    id: string,
    reviewerUid: string,
    reason?: string,
    autoReject = false,
  ): Promise<Submission> {
    const ref = this.col.doc(id);
    const doc = await ref.get();
    if (!doc.exists) throw new NotFoundException('Submission not found');
    const submission = doc.data() as Submission;
    if (submission.status !== SubmissionStatus.PENDING) {
      throw new BadRequestException(`Already ${submission.status}`);
    }
    await ref.update({
      status: SubmissionStatus.REJECTED,
      reviewedAt: new Date().toISOString(),
      reviewerUid: autoReject ? 'system:auto-quiz' : reviewerUid,
      rejectionReason: reason ?? null,
    });
    return this.findOne(id);
  }

  private amountForReward(
    rewards: { screenTimeMin: number; points: number; cashUsd: number },
    type: RewardType,
  ): number {
    switch (type) {
      case RewardType.SCREEN_TIME:
        return rewards.screenTimeMin;
      case RewardType.POINTS:
        return rewards.points;
      case RewardType.CASH:
        return rewards.cashUsd;
    }
  }
}
