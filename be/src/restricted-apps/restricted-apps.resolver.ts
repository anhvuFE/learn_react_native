import { ForbiddenException } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { User } from '../users/user.model';
import { AddRestrictedAppInput } from './restricted-app.input';
import { RestrictedApp } from './restricted-app.model';
import { RestrictedAppsService } from './restricted-apps.service';

@Resolver(() => RestrictedApp)
export class RestrictedAppsResolver {
  constructor(private readonly service: RestrictedAppsService) {}

  @Query(() => [RestrictedApp], { name: 'restrictedApps' })
  list(@CurrentUser() user: User): Promise<RestrictedApp[]> {
    if (!user.familyId) throw new ForbiddenException('No family');
    return this.service.listForFamily(user.familyId);
  }

  @Mutation(() => RestrictedApp)
  addRestrictedApp(
    @CurrentUser() user: User,
    @Args('input') input: AddRestrictedAppInput,
  ): Promise<RestrictedApp> {
    if (!user.familyId) throw new ForbiddenException('No family');
    return this.service.add(user.familyId, input);
  }

  @Mutation(() => Boolean)
  removeRestrictedApp(
    @CurrentUser() user: User,
    @Args('id', { type: () => ID }) id: string,
  ): Promise<boolean> {
    if (!user.familyId) throw new ForbiddenException('No family');
    return this.service.remove(id, user.familyId);
  }
}
