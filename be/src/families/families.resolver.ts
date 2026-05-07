import { ForbiddenException } from '@nestjs/common';
import {
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { User } from '../users/user.model';
import { User as UserModel } from '../users/user.model';
import { UsersService } from '../users/users.service';
import { Family } from './family.model';
import { FamiliesService } from './families.service';

@Resolver(() => Family)
export class FamiliesResolver {
  constructor(
    private readonly families: FamiliesService,
    private readonly users: UsersService,
  ) {}

  @Query(() => Family, {
    name: 'myFamily',
    description: 'Returns the family of the current user',
  })
  async myFamily(@CurrentUser() user: User): Promise<Family> {
    if (!user.familyId) {
      throw new ForbiddenException('User has no family');
    }
    return this.families.findById(user.familyId);
  }

  @ResolveField(() => [UserModel], { name: 'children' })
  async children(@Parent() family: Family): Promise<UserModel[]> {
    const uids = family.childUids ?? [];
    const profiles = await Promise.all(uids.map((uid) => this.users.findByUid(uid)));
    return profiles.filter((p): p is UserModel => !!p);
  }
}
