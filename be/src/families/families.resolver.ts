import { ForbiddenException } from '@nestjs/common';
import { Query, Resolver } from '@nestjs/graphql';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { User } from '../users/user.model';
import { Family } from './family.model';
import { FamiliesService } from './families.service';

@Resolver(() => Family)
export class FamiliesResolver {
  constructor(private readonly families: FamiliesService) {}

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
}
