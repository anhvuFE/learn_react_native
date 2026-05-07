import { Module } from '@nestjs/common';
import { RestrictedAppsResolver } from './restricted-apps.resolver';
import { RestrictedAppsService } from './restricted-apps.service';

@Module({
  providers: [RestrictedAppsService, RestrictedAppsResolver],
  exports: [RestrictedAppsService],
})
export class RestrictedAppsModule {}
