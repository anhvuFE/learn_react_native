import { Field, Float, InputType, Int } from '@nestjs/graphql';
import { RewardType } from '../rewards/reward.model';

@InputType()
export class RequestPhotoUploadInput {
  @Field()
  taskId!: string;
}

@InputType()
export class SubmitPhotoTaskInput {
  @Field()
  taskId!: string;

  @Field(() => RewardType)
  chosenReward!: RewardType;

  @Field({ description: 'Storage path returned from requestPhotoUpload' })
  photoStoragePath!: string;
}

@InputType()
export class SubmitTimerTaskInput {
  @Field()
  taskId!: string;

  @Field(() => RewardType)
  chosenReward!: RewardType;

  @Field(() => Int)
  timerSeconds!: number;
}

@InputType()
export class SubmitQuizTaskInput {
  @Field()
  taskId!: string;

  @Field(() => RewardType)
  chosenReward!: RewardType;

  @Field(() => Float)
  quizScore!: number;
}

@InputType()
export class RejectSubmissionInput {
  @Field()
  id!: string;

  @Field({ nullable: true })
  reason?: string;
}
