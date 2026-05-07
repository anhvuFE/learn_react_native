import { Field, Float, ID, Int, ObjectType, registerEnumType } from '@nestjs/graphql';

export enum TaskType {
  WALK = 'walk',
  VIDEO_QUIZ = 'video_quiz',
  PHOTO = 'photo',
}

export enum TaskStatus {
  AVAILABLE = 'available',
  PENDING_APPROVAL = 'pending_approval',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

registerEnumType(TaskType, { name: 'TaskType' });
registerEnumType(TaskStatus, { name: 'TaskStatus' });

@ObjectType()
export class Rewards {
  @Field(() => Int)
  screenTimeMin!: number;

  @Field(() => Int)
  points!: number;

  @Field(() => Float)
  cashUsd!: number;
}

@ObjectType()
export class Task {
  @Field(() => ID)
  id!: string;

  @Field(() => TaskType)
  type!: TaskType;

  @Field()
  title!: string;

  @Field()
  description!: string;

  @Field(() => Rewards)
  rewards!: Rewards;

  @Field(() => TaskStatus)
  status!: TaskStatus;

  @Field({ nullable: true })
  childId?: string;

  @Field({ nullable: true })
  familyId?: string;

  @Field(() => Int, { nullable: true })
  walkTargetSteps?: number;

  @Field(() => Int, { nullable: true })
  walkTargetSeconds?: number;
}
