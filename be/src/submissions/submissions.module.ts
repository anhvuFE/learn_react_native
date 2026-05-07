import { Module } from '@nestjs/common';
import { TasksModule } from '../tasks/tasks.module';
import { SubmissionsResolver } from './submissions.resolver';
import { SubmissionsService } from './submissions.service';

@Module({
  imports: [TasksModule],
  providers: [SubmissionsService, SubmissionsResolver],
  exports: [SubmissionsService],
})
export class SubmissionsModule {}
