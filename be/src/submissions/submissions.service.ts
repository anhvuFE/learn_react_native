import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { PushService } from '../notifications/push.service';
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
    private readonly push: PushService,
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

    // Dedup — block if there's already a pending submission for this child + task
    const existingPending = await this.col
      .where('childUid', '==', childUid)
      .where('taskId', '==', taskId)
      .where('status', '==', SubmissionStatus.PENDING)
      .limit(1)
      .get();
    if (!existingPending.empty) {
      throw new BadRequestException(
        'You already have a submission waiting for parent review for this mission. Wait for the result before submitting again.',
      );
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
    const submission = await this.createBase(
      childUid,
      familyId,
      input.taskId,
      input.chosenReward,
      { photoStoragePath: input.photoStoragePath },
    );
    const settings = await this.parentSettings(familyId);
    if (!settings.requirePhotoApproval) {
      // Parent opted out of photo review → auto-approve
      return this.approve(submission.id, childUid, /* autoApprove */ true);
    }
    // Notify parent that a submission is waiting
    return this.notifyParentForReview(
      submission,
      `Photo evidence for "${(await this.tasks.findOne(input.taskId)).title}"`,
    );
  }

  private async parentUidForFamily(familyId: string): Promise<string | null> {
    const doc = await this.firebase.firestore
      .collection('families')
      .doc(familyId)
      .get();
    if (!doc.exists) return null;
    return (doc.data() as { parentUid?: string }).parentUid ?? null;
  }

  private async isWithinBedtimeFor(familyId?: string): Promise<boolean> {
    if (!familyId) return false;
    const parentUid = await this.parentUidForFamily(familyId);
    if (!parentUid) return false;
    const parentDoc = await this.firebase.firestore
      .collection('users')
      .doc(parentUid)
      .get();
    const bedtime = (parentDoc.data() as { bedtimeMode?: boolean })?.bedtimeMode;
    if (!bedtime) return false;
    const hour = new Date().getHours();
    return hour >= 21 || hour < 7;
  }

  private async dailyCapFor(familyId?: string): Promise<number | null> {
    if (!familyId) return null;
    const parentUid = await this.parentUidForFamily(familyId);
    if (!parentUid) return null;
    const doc = await this.firebase.firestore
      .collection('users')
      .doc(parentUid)
      .get();
    const cap = (doc.data() as { dailyScreenTimeCapMin?: number })
      ?.dailyScreenTimeCapMin;
    return typeof cap === 'number' && cap > 0 ? cap : null;
  }

  private async screenTimeMinutesUsedToday(childUid: string): Promise<number> {
    const now = new Date();
    const startOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    ).toISOString();
    const snap = await this.firebase.firestore
      .collection('rewards')
      .where('childUid', '==', childUid)
      .where('type', '==', 'screen-time')
      .get();
    let total = 0;
    for (const d of snap.docs) {
      const data = d.data() as {
        amount?: number;
        createdAt?: string;
        status?: string;
      };
      if (data.status === 'cancelled') continue;
      if (!data.createdAt || data.createdAt < startOfDay) continue;
      total += data.amount ?? 0;
    }
    return total;
  }

  private async parentSettings(familyId?: string): Promise<{
    autoApproveWalk: boolean;
    autoApproveQuiz: boolean;
    requirePhotoApproval: boolean;
  }> {
    const fallback = {
      autoApproveWalk: true,
      autoApproveQuiz: true,
      requirePhotoApproval: true,
    };
    if (!familyId) return fallback;
    const parentUid = await this.parentUidForFamily(familyId);
    if (!parentUid) return fallback;
    const doc = await this.firebase.firestore
      .collection('users')
      .doc(parentUid)
      .get();
    const data = doc.data() as
      | {
          autoApproveWalk?: boolean;
          autoApproveQuiz?: boolean;
          requirePhotoApproval?: boolean;
        }
      | undefined;
    return {
      autoApproveWalk: data?.autoApproveWalk ?? true,
      autoApproveQuiz: data?.autoApproveQuiz ?? true,
      requirePhotoApproval: data?.requirePhotoApproval ?? true,
    };
  }

  async submitTimer(
    childUid: string,
    familyId: string,
    input: SubmitTimerTaskInput,
  ): Promise<Submission> {
    const submission = await this.createBase(
      childUid,
      familyId,
      input.taskId,
      input.chosenReward,
      { timerSeconds: input.timerSeconds },
    );
    const settings = await this.parentSettings(familyId);
    if (settings.autoApproveWalk) {
      return this.approve(submission.id, childUid, /* autoApprove */ true);
    }
    // Stays PENDING — parent reviews via PWA / mobile review screen
    return this.notifyParentForReview(submission, 'Walk submission to review');
  }

  /**
   * Quiz auto-approves if (a) parent enabled autoApproveQuiz AND (b) score ≥ threshold.
   * Otherwise PENDING for parent review (or rejected if score below threshold).
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

    if (!passed) {
      return this.reject(
        submission.id,
        childUid,
        `Score ${input.quizScore.toFixed(0)}% below pass threshold ${QUIZ_PASS_THRESHOLD}%`,
        true,
      );
    }
    const settings = await this.parentSettings(familyId);
    if (settings.autoApproveQuiz) {
      return this.approve(submission.id, childUid, /* autoApprove */ true);
    }
    return this.notifyParentForReview(submission, 'Quiz submission to review');
  }

  private async notifyParentForReview(
    submission: Submission,
    title: string,
  ): Promise<Submission> {
    if (submission.familyId) {
      const parentUid = await this.parentUidForFamily(submission.familyId);
      if (parentUid) {
        const task = await this.tasks.findOne(submission.taskId);
        void this.push.send({
          uid: parentUid,
          title,
          body: task.title,
          data: { kind: 'submission_pending', submissionId: submission.id },
        });
      }
    }
    return submission;
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

    // Bedtime mode: if parent enabled bedtime and current local hour is 21:00–07:00,
    // block screen-time reward grants. Points/cash still allowed.
    if (submission.chosenReward === RewardType.SCREEN_TIME) {
      const blocked = await this.isWithinBedtimeFor(submission.familyId);
      if (blocked) {
        throw new BadRequestException(
          'Screen-time rewards are paused during bedtime hours (9 PM – 7 AM). Approve again later or pick a different reward.',
        );
      }

      // Daily screen-time cap enforcement
      const cap = await this.dailyCapFor(submission.familyId);
      if (cap !== null && cap > 0) {
        const usedToday = await this.screenTimeMinutesUsedToday(
          submission.childUid,
        );
        const requested = await this.tasks
          .findOne(submission.taskId)
          .then((t) => t.rewards.screenTimeMin);
        if (usedToday + requested > cap) {
          throw new BadRequestException(
            `Daily screen-time cap reached. Already earned ${usedToday} of ${cap} minutes today; this reward would push past the cap.`,
          );
        }
      }
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

    // Notify child that their submission was approved
    void this.push.send({
      uid: submission.childUid,
      title: 'Mission approved! 🎉',
      body: `You earned ${this.formatRewardAmount(reward.type, reward.amount)} for "${task.title}"`,
      data: { kind: 'submission_approved', submissionId: id, rewardId: reward.id },
    });

    return this.findOne(id);
  }

  private formatRewardAmount(type: string, amount: number): string {
    if (type === RewardType.SCREEN_TIME) return `${amount} min screen time`;
    if (type === RewardType.POINTS) return `${amount} points`;
    return `$${amount.toFixed(2)}`;
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

    // Notify child of rejection (skip auto-rejected quizzes — child sees result inline)
    if (!autoReject) {
      void this.push.send({
        uid: submission.childUid,
        title: 'Mission needs another try',
        body: reason ?? 'Parent asked you to retake — open the app to try again.',
        data: { kind: 'submission_rejected', submissionId: id },
      });
    }

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
