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
export class QuizQuestionInput {
  @Field()
  question!: string;

  @Field(() => [String])
  options!: string[];

  @Field(() => Int)
  correctIndex!: number;
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

  @Field({ nullable: true })
  assignedToChildUid?: string;

  @Field(() => Int, { nullable: true })
  walkTargetSteps?: number;

  @Field(() => Int, { nullable: true })
  walkTargetSeconds?: number;

  @Field({ nullable: true })
  videoTitle?: string;

  @Field(() => Int, { nullable: true })
  quizSecondsPerQuestion?: number;

  @Field(() => [QuizQuestionInput], { nullable: true })
  quiz?: QuizQuestionInput[];
}

@InputType()
export class UpdateTaskInput {
  @Field({ nullable: true })
  title?: string;

  @Field({ nullable: true })
  description?: string;

  @Field(() => RewardsInput, { nullable: true })
  rewards?: RewardsInput;

  @Field({ nullable: true })
  assignedToChildUid?: string;

  @Field(() => Int, { nullable: true })
  walkTargetSteps?: number;

  @Field(() => Int, { nullable: true })
  walkTargetSeconds?: number;

  @Field({ nullable: true })
  videoTitle?: string;

  @Field(() => Int, { nullable: true })
  quizSecondsPerQuestion?: number;

  @Field(() => [QuizQuestionInput], { nullable: true })
  quiz?: QuizQuestionInput[];
}
