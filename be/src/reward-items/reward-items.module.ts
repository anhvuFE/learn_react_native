import { Module } from '@nestjs/common';
import { RewardsModule } from '../rewards/rewards.module';
import { RewardItemsResolver } from './reward-items.resolver';
import { RewardItemsService } from './reward-items.service';

@Module({
  imports: [RewardsModule],
  providers: [RewardItemsService, RewardItemsResolver],
})
export class RewardItemsModule {}
