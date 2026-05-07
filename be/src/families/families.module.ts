import { Global, Module } from '@nestjs/common';
import { FamiliesResolver } from './families.resolver';
import { FamiliesService } from './families.service';

@Global()
@Module({
  providers: [FamiliesService, FamiliesResolver],
  exports: [FamiliesService],
})
export class FamiliesModule {}
