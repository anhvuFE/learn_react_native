import { Field, Float, InputType, Int } from '@nestjs/graphql';
import { TaskType } from './task.model';

@InputType()
export class RewardsInput {
  @Field(() => Int)
  screenTimeMin!: number;

  @Field(() => Int)
  points!: number;

  @Field(() => Float)
  cashUsd!: number;
}

@InputType()
export class CreateTaskInput {
  @Field(() => TaskType)
  type!: TaskType;

  @Field()
  title!: string;

  @Field()
  description!: string;

  @Field(() => RewardsInput)
  rewards!: RewardsInput;

  @Field({ nullable: true })
  childId?: string;

  @Field({ nullable: true })
  familyId?: string;

  @Field(() => Int, { nullable: true })
  walkTargetSteps?: number;

  @Field(() => Int, { nullable: true })
  walkTargetSeconds?: number;
}
