import { Global, Module } from '@nestjs/common';
import { RewardsResolver } from './rewards.resolver';
import { RewardsService } from './rewards.service';

@Global()
@Module({
  providers: [RewardsService, RewardsResolver],
  exports: [RewardsService],
})
export class RewardsModule {}
