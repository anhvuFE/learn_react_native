import { Global, Module } from '@nestjs/common';
import { TasksModule } from '../tasks/tasks.module';
import { RewardsResolver } from './rewards.resolver';
import { RewardsService } from './rewards.service';

@Global()
@Module({
  imports: [TasksModule],
  providers: [RewardsService, RewardsResolver],
  exports: [RewardsService],
})
export class RewardsModule {}
