import { ForbiddenException } from '@nestjs/common';
import { Args, ID, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { User } from '../users/user.model';
import { UserRole } from '../users/user.model';
import { Bank, Reward } from './reward.model';
import { RewardsService } from './rewards.service';

@Resolver(() => Reward)
export class RewardsResolver {
  constructor(private readonly rewards: RewardsService) {}

  @Query(() => Bank, { name: 'myBank' })
  myBank(@CurrentUser() user: User): Promise<Bank> {
    return this.rewards.getBank(user.uid);
  }

  @Query(() => [Reward], { name: 'myRewards' })
  myRewards(
    @CurrentUser() user: User,
    @Args('limit', { type: () => Int, nullable: true, defaultValue: 50 })
    limit: number,
  ): Promise<Reward[]> {
    return this.rewards.listForChild(user.uid, limit);
  }

  @Query(() => Bank, { name: 'childBank', description: 'Parent: read a child bank' })
  async childBank(
    @CurrentUser() user: User,
    @Args('childUid') childUid: string,
  ): Promise<Bank> {
    if (user.role !== UserRole.PARENT) {
      throw new ForbiddenException('Only parents can read child banks');
    }
    return this.rewards.getBank(childUid);
  }

  @Mutation(() => Reward)
  async cancelReward(
    @CurrentUser() user: User,
    @Args('id', { type: () => ID }) id: string,
  ): Promise<Reward> {
    const reward = await this.rewards.findOne(id);
    if (user.role !== UserRole.PARENT || reward.familyId !== user.familyId) {
      throw new ForbiddenException('Cannot cancel this reward');
    }
    return this.rewards.cancel(id);
  }
}
