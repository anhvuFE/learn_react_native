import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UpdateProfileInput, UpdateSettingsInput } from './user.input';
import { User } from './user.model';
import { UsersService } from './users.service';

@Resolver(() => User)
export class UsersResolver {
  constructor(private readonly users: UsersService) {}

  @Query(() => User, { name: 'me', description: 'Returns the current user profile' })
  me(@CurrentUser() user: User): User {
    return user;
  }

  @Mutation(() => Boolean, {
    description: 'Register Expo push token for the current user',
  })
  async setPushToken(
    @CurrentUser() user: User,
    @Args('token', { type: () => String, nullable: true })
    token: string | null,
  ): Promise<boolean> {
    await this.users.setPushToken(user.uid, token);
    return true;
  }

  @Mutation(() => User)
  async updateMyProfile(
    @CurrentUser() user: User,
    @Args('input') input: UpdateProfileInput,
  ): Promise<User> {
    return this.users.update(user.uid, { ...input });
  }

  @Mutation(() => User)
  async updateMySettings(
    @CurrentUser() user: User,
    @Args('input') input: UpdateSettingsInput,
  ): Promise<User> {
    return this.users.update(user.uid, { ...input });
  }
}
