import { ForbiddenException } from '@nestjs/common';
import { Args, Int, Query, Resolver } from '@nestjs/graphql';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { User } from '../users/user.model';
import { ActivityEvent } from './activity.model';
import { ActivityService } from './activity.service';

@Resolver(() => ActivityEvent)
export class ActivityResolver {
  constructor(private readonly activity: ActivityService) {}

  @Query(() => [ActivityEvent], { name: 'familyActivity' })
  async familyActivity(
    @CurrentUser() user: User,
    @Args('childUid', { nullable: true }) childUid?: string,
    @Args('limit', { type: () => Int, nullable: true, defaultValue: 100 })
    limit?: number,
  ): Promise<ActivityEvent[]> {
    if (!user.familyId) throw new ForbiddenException('No family');
    return this.activity.familyActivity(user.familyId, childUid, limit ?? 100);
  }
}
