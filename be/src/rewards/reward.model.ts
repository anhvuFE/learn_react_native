import { Field, Float, ID, Int, ObjectType, registerEnumType } from '@nestjs/graphql';

export enum RewardType {
  SCREEN_TIME = 'screen-time',
  POINTS = 'points',
  CASH = 'cash',
}
registerEnumType(RewardType, { name: 'RewardType' });

export enum RewardStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
  CLAIMED = 'claimed', // for points/cash that don't expire
}
registerEnumType(RewardStatus, { name: 'RewardStatus' });

@ObjectType()
export class Reward {
  @Field(() => ID)
  id!: string;

  @Field()
  childUid!: string;

  @Field()
  familyId!: string;

  @Field()
  taskId!: string;

  @Field()
  submissionId!: string;

  @Field(() => RewardType)
  type!: RewardType;

  @Field(() => Float, { description: 'Minutes for screen-time, count for points, USD for cash' })
  amount!: number;

  @Field(() => RewardStatus)
  status!: RewardStatus;

  @Field()
  createdAt!: string;

  @Field({ nullable: true, description: 'Set for screen-time rewards' })
  startedAt?: string;

  @Field({ nullable: true, description: 'Set for screen-time rewards' })
  expiresAt?: string;
}

@ObjectType()
export class Bank {
  @Field()
  uid!: string;

  @Field(() => Int)
  points!: number;

  @Field(() => Float)
  cashUsd!: number;

  @Field(() => Int, { description: 'Active screen-time minutes remaining (0 if no active reward)' })
  screenTimeMinutesRemaining!: number;

  @Field(() => Reward, { nullable: true })
  activeReward?: Reward;
}
