import { Module } from '@nestjs/common';
import { PairingResolver } from './pairing.resolver';
import { PairingService } from './pairing.service';

@Module({
  providers: [PairingService, PairingResolver],
})
export class PairingModule {}
