import { Global, Module } from '@nestjs/common';
import { StorageModule } from '../storage/storage.module';
import { UsersResolver } from './users.resolver';
import { UsersService } from './users.service';

@Global()
@Module({
  imports: [StorageModule],
  providers: [UsersService, UsersResolver],
  exports: [UsersService],
})
export class UsersModule {}
