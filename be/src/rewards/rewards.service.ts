import { Injectable, NotFoundException } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { Bank, Reward, RewardStatus, RewardType } from './reward.model';

const COLLECTION = 'rewards';

interface IssueRewardInput {
  childUid: string;
  familyId: string;
  taskId: string;
  submissionId: string;
  type: RewardType;
  amount: number;
  durationMinutes?: number;
}

@Injectable()
export class RewardsService {
  constructor(private readonly firebase: FirebaseService) {}

  private get col() {
    return this.firebase.firestore.collection(COLLECTION);
  }

  private mapDoc(doc: FirebaseFirestore.DocumentSnapshot): Reward {
    return { id: doc.id, ...doc.data() } as Reward;
  }

  async issue(input: IssueRewardInput): Promise<Reward> {
    const now = new Date();
    const data: Omit<Reward, 'id'> = {
      childUid: input.childUid,
      familyId: input.familyId,
      taskId: input.taskId,
      submissionId: input.submissionId,
      type: input.type,
      amount: input.amount,
      status:
        input.type === RewardType.SCREEN_TIME
          ? RewardStatus.ACTIVE
          : RewardStatus.CLAIMED,
      createdAt: now.toISOString(),
    };

    if (input.type === RewardType.SCREEN_TIME) {
      const expires = new Date(
        now.getTime() + (input.durationMinutes ?? input.amount) * 60_000,
      );
      data.startedAt = now.toISOString();
      data.expiresAt = expires.toISOString();
    }

    const ref = await this.col.add(data);
    const snap = await ref.get();
    return this.mapDoc(snap);
  }

  async findOne(id: string): Promise<Reward> {
    const doc = await this.col.doc(id).get();
    if (!doc.exists) throw new NotFoundException(`Reward ${id} not found`);
    return this.mapDoc(doc);
  }

  async listForChild(childUid: string, limit = 50): Promise<Reward[]> {
    const snap = await this.col
      .where('childUid', '==', childUid)
      .limit(500)
      .get();
    return snap.docs
      .map((d) => this.mapDoc(d))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, limit);
  }

  async findActiveScreenTime(childUid: string): Promise<Reward | null> {
    const snap = await this.col.where('childUid', '==', childUid).get();
    const candidates = snap.docs
      .map((d) => this.mapDoc(d))
      .filter(
        (r) =>
          r.type === RewardType.SCREEN_TIME &&
          r.status === RewardStatus.ACTIVE,
      );
    if (candidates.length === 0) return null;
    const reward = candidates[0];
    if (reward.expiresAt && new Date(reward.expiresAt).getTime() < Date.now()) {
      await this.col.doc(reward.id).update({ status: RewardStatus.EXPIRED });
      return null;
    }
    return reward;
  }

  async cancel(id: string): Promise<Reward> {
    await this.col.doc(id).update({ status: RewardStatus.CANCELLED });
    return this.findOne(id);
  }

  async getBank(uid: string): Promise<Bank> {
    const all = await this.listForChild(uid, 1000);
    let points = 0;
    let cashUsd = 0;
    for (const r of all) {
      if (r.type === RewardType.POINTS) points += r.amount;
      else if (r.type === RewardType.CASH) cashUsd += r.amount;
    }
    const active = await this.findActiveScreenTime(uid);
    const screenTimeMinutesRemaining = active?.expiresAt
      ? Math.max(
          0,
          Math.ceil(
            (new Date(active.expiresAt).getTime() - Date.now()) / 60_000,
          ),
        )
      : 0;
    return {
      uid,
      points,
      cashUsd,
      screenTimeMinutesRemaining,
      activeReward: active ?? undefined,
    };
  }
}
