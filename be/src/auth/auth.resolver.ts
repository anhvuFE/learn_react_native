import { Query, Resolver } from '@nestjs/graphql';
import { Public } from './decorators/public.decorator';

@Resolver()
export class AuthResolver {
  @Public()
  @Query(() => String, { name: 'health', description: 'Public health check' })
  health(): string {
    return 'ok';
  }
}
