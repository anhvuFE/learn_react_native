import {
  Args,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { StorageService } from '../storage/storage.service';
import { UpdateProfileInput, UpdateSettingsInput } from './user.input';
import { User } from './user.model';
import { UsersService } from './users.service';

@Resolver(() => User)
export class UsersResolver {
  constructor(
    private readonly users: UsersService,
    private readonly storage: StorageService,
  ) {}

  @ResolveField(() => String, { nullable: true })
  async photoDownloadUrl(@Parent() user: User): Promise<string | null> {
    if (!user.photoStoragePath) return null;
    try {
      return await this.storage.getReadUrl(user.photoStoragePath);
    } catch {
      return null;
    }
  }

  @Mutation(() => String, {
    description: 'Returns a signed PUT URL for uploading an avatar image.',
  })
  async requestAvatarUpload(
    @CurrentUser() user: User,
    @Args('contentType', { type: () => String, defaultValue: 'image/jpeg' })
    contentType: string,
  ): Promise<string> {
    const ext = contentType.includes('png') ? 'png' : 'jpg';
    const path = `avatars/${user.uid}/${Date.now()}.${ext}`;
    const url = await this.storage.getUploadUrl(path, contentType);
    // Persist storage path so subsequent reads resolve photoDownloadUrl
    await this.users.update(user.uid, { photoStoragePath: path });
    return url;
  }

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

  @Mutation(() => Boolean, {
    description: 'Register FCM web push token for the current user',
  })
  async setWebPushToken(
    @CurrentUser() user: User,
    @Args('token', { type: () => String, nullable: true })
    token: string | null,
  ): Promise<boolean> {
    await this.users.update(user.uid, { webPushToken: token });
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

  @Mutation(() => Boolean, {
    description:
      'Permanently delete the current account. Parent: cascades family + children + tasks + submissions + rewards + apps. Child: removes self from family.',
  })
  async deleteMyAccount(@CurrentUser() user: User): Promise<boolean> {
    await this.users.deleteAccount(user);
    return true;
  }
}
