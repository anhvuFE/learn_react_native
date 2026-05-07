import { Global, Module } from '@nestjs/common';
import { UsersResolver } from './users.resolver';
import { UsersService } from './users.service';

@Global()
@Module({
  providers: [UsersService, UsersResolver],
  exports: [UsersService],
})
export class UsersModule {}
