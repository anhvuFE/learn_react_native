import {
  Field,
  Float,
  ID,
  Int,
  ObjectType,
  registerEnumType,
} from '@nestjs/graphql';

export enum ActivityKind {
  SUBMITTED = 'submitted',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  REWARD_GRANTED = 'reward_granted',
}

registerEnumType(ActivityKind, { name: 'ActivityKind' });

@ObjectType()
export class ActivityEvent {
  @Field(() => ID)
  id!: string;

  @Field(() => ActivityKind)
  kind!: ActivityKind;

  @Field()
  occurredAt!: string;

  @Field()
  childUid!: string;

  @Field({ nullable: true })
  taskId?: string;

  @Field({ nullable: true })
  taskTitle?: string;

  @Field({ nullable: true })
  taskType?: string;

  @Field({ nullable: true })
  rewardType?: string;

  @Field(() => Float, { nullable: true })
  rewardAmount?: number;

  @Field({ nullable: true })
  rejectionReason?: string;

  @Field(() => Int, { nullable: true })
  quizScore?: number;
}
