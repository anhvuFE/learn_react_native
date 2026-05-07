import { Injectable } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { ActivityEvent, ActivityKind } from './activity.model';

interface SubmissionDoc {
  id: string;
  taskId?: string;
  childUid?: string;
  status?: string;
  submittedAt?: string;
  reviewedAt?: string;
  rejectionReason?: string;
  quizScore?: number;
  rewardId?: string;
}

interface RewardDoc {
  id: string;
  taskId?: string;
  childUid?: string;
  type?: string;
  amount?: number;
  createdAt?: string;
}

interface TaskDoc {
  id: string;
  title?: string;
  type?: string;
}

@Injectable()
export class ActivityService {
  constructor(private readonly firebase: FirebaseService) {}

  private get db() {
    return this.firebase.firestore;
  }

  async familyActivity(
    familyId: string,
    childUid?: string,
    limit = 100,
  ): Promise<ActivityEvent[]> {
    let subQ = this.db
      .collection('submissions')
      .where('familyId', '==', familyId);
    let rewQ = this.db
      .collection('rewards')
      .where('familyId', '==', familyId);
    if (childUid) {
      subQ = subQ.where('childUid', '==', childUid);
      rewQ = rewQ.where('childUid', '==', childUid);
    }
    const [subSnap, rewSnap] = await Promise.all([subQ.get(), rewQ.get()]);
    const subs: SubmissionDoc[] = subSnap.docs.map(
      (d) => ({ id: d.id, ...d.data() }) as SubmissionDoc,
    );
    const rewards: RewardDoc[] = rewSnap.docs.map(
      (d) => ({ id: d.id, ...d.data() }) as RewardDoc,
    );

    // Resolve task titles in batch
    const taskIds = new Set<string>();
    [...subs, ...rewards].forEach((d) => d.taskId && taskIds.add(d.taskId));
    const tasks = new Map<string, TaskDoc>();
    if (taskIds.size > 0) {
      const taskDocs = await Promise.all(
        Array.from(taskIds).map((id) =>
          this.db.collection('tasks').doc(id).get(),
        ),
      );
      taskDocs.forEach((d) => {
        if (d.exists) tasks.set(d.id, { id: d.id, ...d.data() } as TaskDoc);
      });
    }

    const events: ActivityEvent[] = [];

    for (const s of subs) {
      const task = s.taskId ? tasks.get(s.taskId) : undefined;
      const submittedAt = s.submittedAt;
      if (submittedAt) {
        events.push({
          id: `sub-submitted-${s.id}`,
          kind: ActivityKind.SUBMITTED,
          occurredAt: submittedAt,
          childUid: s.childUid ?? '',
          taskId: s.taskId,
          taskTitle: task?.title,
          taskType: task?.type,
          quizScore: s.quizScore,
        });
      }
      if (s.status === 'approved' && s.reviewedAt) {
        events.push({
          id: `sub-approved-${s.id}`,
          kind: ActivityKind.APPROVED,
          occurredAt: s.reviewedAt,
          childUid: s.childUid ?? '',
          taskId: s.taskId,
          taskTitle: task?.title,
          taskType: task?.type,
        });
      }
      if (s.status === 'rejected' && s.reviewedAt) {
        events.push({
          id: `sub-rejected-${s.id}`,
          kind: ActivityKind.REJECTED,
          occurredAt: s.reviewedAt,
          childUid: s.childUid ?? '',
          taskId: s.taskId,
          taskTitle: task?.title,
          taskType: task?.type,
          rejectionReason: s.rejectionReason,
        });
      }
    }

    for (const r of rewards) {
      const task = r.taskId ? tasks.get(r.taskId) : undefined;
      if (r.createdAt) {
        events.push({
          id: `rew-${r.id}`,
          kind: ActivityKind.REWARD_GRANTED,
          occurredAt: r.createdAt,
          childUid: r.childUid ?? '',
          taskId: r.taskId,
          taskTitle: task?.title,
          taskType: task?.type,
          rewardType: r.type,
          rewardAmount: r.amount,
        });
      }
    }

    events.sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
    return events.slice(0, limit);
  }
}
