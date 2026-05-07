import { Query, Resolver } from '@nestjs/graphql';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from './user.model';

@Resolver(() => User)
export class UsersResolver {
  @Query(() => User, { name: 'me', description: 'Returns the current user profile' })
  me(@CurrentUser() user: User): User {
    return user;
  }
}
