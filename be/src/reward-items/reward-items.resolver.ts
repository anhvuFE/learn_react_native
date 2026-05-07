import { ForbiddenException } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../users/user.model';
import type { User } from '../users/user.model';
import {
  CreateRewardItemInput,
  UpdateRewardItemInput,
} from './reward-item.input';
import { RewardItem, RewardRedemption } from './reward-item.model';
import { RewardItemsService } from './reward-items.service';

function ensureFamily(user: User): string {
  if (!user.familyId) throw new ForbiddenException('No family');
  return user.familyId;
}

@Resolver(() => RewardItem)
export class RewardItemsResolver {
  constructor(private readonly items: RewardItemsService) {}

  @Query(() => [RewardItem], {
    name: 'rewardItems',
    description: 'List family reward shop items',
  })
  list(@CurrentUser() user: User): Promise<RewardItem[]> {
    return this.items.listForFamily(ensureFamily(user));
  }

  @Mutation(() => RewardItem)
  async createRewardItem(
    @CurrentUser() user: User,
    @Args('input') input: CreateRewardItemInput,
  ): Promise<RewardItem> {
    if (user.role !== UserRole.PARENT) {
      throw new ForbiddenException('Only parents can create items');
    }
    return this.items.create(ensureFamily(user), input);
  }

  @Mutation(() => RewardItem)
  async updateRewardItem(
    @CurrentUser() user: User,
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateRewardItemInput,
  ): Promise<RewardItem> {
    if (user.role !== UserRole.PARENT) {
      throw new ForbiddenException('Only parents can update items');
    }
    const item = await this.items.findOne(id);
    if (item.familyId !== user.familyId) {
      throw new ForbiddenException('Not in your family');
    }
    return this.items.update(id, input);
  }

  @Mutation(() => Boolean)
  async deleteRewardItem(
    @CurrentUser() user: User,
    @Args('id', { type: () => ID }) id: string,
  ): Promise<boolean> {
    if (user.role !== UserRole.PARENT) {
      throw new ForbiddenException('Only parents');
    }
    const item = await this.items.findOne(id);
    if (item.familyId !== user.familyId) {
      throw new ForbiddenException('Not in your family');
    }
    return this.items.remove(id);
  }

  @Mutation(() => RewardRedemption)
  async redeemRewardItem(
    @CurrentUser() user: User,
    @Args('id', { type: () => ID }) id: string,
  ): Promise<RewardRedemption> {
    if (user.role !== UserRole.CHILD) {
      throw new ForbiddenException('Only children can redeem');
    }
    return this.items.redeem(user.uid, ensureFamily(user), id);
  }

  @Query(() => [RewardRedemption], { name: 'redemptions' })
  listRedemptions(
    @CurrentUser() user: User,
    @Args('childUid', { nullable: true }) childUid?: string,
  ): Promise<RewardRedemption[]> {
    return this.items.listRedemptions(ensureFamily(user), childUid);
  }

  @Mutation(() => RewardRedemption)
  async fulfillRedemption(
    @CurrentUser() user: User,
    @Args('id', { type: () => ID }) id: string,
  ): Promise<RewardRedemption> {
    if (user.role !== UserRole.PARENT) {
      throw new ForbiddenException('Only parents fulfill');
    }
    return this.items.fulfillRedemption(id);
  }
}
