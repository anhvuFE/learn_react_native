import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { RewardsService } from '../rewards/rewards.service';
import {
  CreateRewardItemInput,
  UpdateRewardItemInput,
} from './reward-item.input';
import { RewardItem, RewardRedemption } from './reward-item.model';

@Injectable()
export class RewardItemsService {
  constructor(
    private readonly firebase: FirebaseService,
    private readonly rewards: RewardsService,
  ) {}

  private get db() {
    return this.firebase.firestore;
  }

  async listForFamily(familyId: string): Promise<RewardItem[]> {
    const snap = await this.db
      .collection('rewardItems')
      .where('familyId', '==', familyId)
      .get();
    return snap.docs
      .map((d) => ({ id: d.id, ...d.data() }) as RewardItem)
      .sort((a, b) => a.costPoints - b.costPoints);
  }

  async findOne(id: string): Promise<RewardItem> {
    const doc = await this.db.collection('rewardItems').doc(id).get();
    if (!doc.exists) throw new NotFoundException('Reward item not found');
    return { id: doc.id, ...doc.data() } as RewardItem;
  }

  async create(
    familyId: string,
    input: CreateRewardItemInput,
  ): Promise<RewardItem> {
    const data = {
      familyId,
      name: input.name,
      description: input.description ?? null,
      emoji: input.emoji ?? null,
      costPoints: input.costPoints,
      stock: input.stock,
      active: true,
      createdAt: new Date().toISOString(),
    };
    const ref = await this.db.collection('rewardItems').add(data);
    const created = await ref.get();
    return { id: created.id, ...created.data() } as RewardItem;
  }

  async update(id: string, input: UpdateRewardItemInput): Promise<RewardItem> {
    const cleaned: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(input)) {
      if (v !== undefined) cleaned[k] = v;
    }
    if (Object.keys(cleaned).length > 0) {
      await this.db.collection('rewardItems').doc(id).update(cleaned);
    }
    return this.findOne(id);
  }

  async remove(id: string): Promise<boolean> {
    await this.db.collection('rewardItems').doc(id).delete();
    return true;
  }

  async redeem(
    childUid: string,
    familyId: string,
    itemId: string,
  ): Promise<RewardRedemption> {
    const item = await this.findOne(itemId);
    if (item.familyId !== familyId) {
      throw new BadRequestException('Item not in your family');
    }
    if (!item.active) {
      throw new BadRequestException('Item not available');
    }
    if (item.stock === 0) {
      throw new BadRequestException('Out of stock');
    }

    // Check + deduct points atomically via the rewards service helper
    const bank = await this.rewards.getBank(childUid);
    if (bank.points < item.costPoints) {
      throw new BadRequestException(
        `Not enough points (need ${item.costPoints}, have ${bank.points})`,
      );
    }

    // Record a negative-amount reward to deduct points from bank computation
    await this.db.collection('rewards').add({
      familyId,
      childUid,
      taskId: null,
      submissionId: null,
      type: 'points',
      amount: -item.costPoints,
      status: 'consumed',
      createdAt: new Date().toISOString(),
      itemId: item.id,
      itemName: item.name,
    });

    // Decrement stock
    if (item.stock > 0) {
      await this.db
        .collection('rewardItems')
        .doc(itemId)
        .update({ stock: item.stock - 1 });
    }

    const redemptionRef = await this.db.collection('redemptions').add({
      itemId: item.id,
      itemName: item.name,
      costPoints: item.costPoints,
      childUid,
      familyId,
      status: 'pending',
      redeemedAt: new Date().toISOString(),
    });
    const created = await redemptionRef.get();
    return { id: created.id, ...created.data() } as RewardRedemption;
  }

  async fulfillRedemption(id: string): Promise<RewardRedemption> {
    await this.db
      .collection('redemptions')
      .doc(id)
      .update({
        status: 'fulfilled',
        fulfilledAt: new Date().toISOString(),
      });
    const doc = await this.db.collection('redemptions').doc(id).get();
    return { id: doc.id, ...doc.data() } as RewardRedemption;
  }

  async listRedemptions(
    familyId: string,
    childUid?: string,
  ): Promise<RewardRedemption[]> {
    let q = this.db
      .collection('redemptions')
      .where('familyId', '==', familyId);
    if (childUid) q = q.where('childUid', '==', childUid);
    const snap = await q.get();
    return snap.docs
      .map((d) => ({ id: d.id, ...d.data() }) as RewardRedemption)
      .sort((a, b) => b.redeemedAt.localeCompare(a.redeemedAt));
  }
}
