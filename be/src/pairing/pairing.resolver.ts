import { ForbiddenException } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import type { User } from '../users/user.model';
import { UserRole } from '../users/user.model';
import { PairChildDeviceInput } from './pairing.input';
import { PairingCode, PairingResult } from './pairing.model';
import { PairingService } from './pairing.service';

@Resolver()
export class PairingResolver {
  constructor(private readonly pairing: PairingService) {}

  @Query(() => [PairingCode], { name: 'myPairingCodes' })
  myPairingCodes(@CurrentUser() user: User): Promise<PairingCode[]> {
    if (user.role !== UserRole.PARENT) {
      throw new ForbiddenException('Parents only');
    }
    return this.pairing.listActiveForParent(user.uid);
  }

  @Mutation(() => PairingCode, {
    description: 'Parent generates a 6-char pairing code for a new child',
  })
  async createPairingCode(
    @CurrentUser() user: User,
    @Args('childName') childName: string,
  ): Promise<PairingCode> {
    if (user.role !== UserRole.PARENT) {
      throw new ForbiddenException('Only parents can create pairing codes');
    }
    if (!user.familyId) {
      throw new ForbiddenException('Parent has no family');
    }
    return this.pairing.createCode(user.uid, user.familyId, childName);
  }

  @Public()
  @Mutation(() => PairingResult, {
    description:
      'Child enters pairing code, receives Firebase custom token to sign in',
  })
  async pairChild(
    @Args('code') code: string,
    @Args('device', { nullable: true }) device?: PairChildDeviceInput,
  ): Promise<PairingResult> {
    return this.pairing.consumeCode(code, device);
  }
}
