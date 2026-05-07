import { Field, Float, ID, Int, ObjectType, registerEnumType } from '@nestjs/graphql';
import { RewardType } from '../rewards/reward.model';

export enum SubmissionStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}
registerEnumType(SubmissionStatus, { name: 'SubmissionStatus' });

@ObjectType()
export class PhotoUploadTarget {
  @Field({ description: 'Storage path the child should upload to' })
  storagePath!: string;

  @Field({ description: 'Pre-signed PUT URL (15 min TTL)' })
  uploadUrl!: string;

  @Field()
  contentType!: string;
}

@ObjectType()
export class Submission {
  @Field(() => ID)
  id!: string;

  @Field()
  taskId!: string;

  @Field()
  childUid!: string;

  @Field()
  familyId!: string;

  @Field(() => RewardType)
  chosenReward!: RewardType;

  @Field(() => SubmissionStatus)
  status!: SubmissionStatus;

  @Field()
  submittedAt!: string;

  @Field({ nullable: true })
  reviewedAt?: string;

  @Field({ nullable: true })
  reviewerUid?: string;

  @Field({ nullable: true })
  rejectionReason?: string;

  @Field({ nullable: true, description: 'Set after approval' })
  rewardId?: string;

  // Type-specific evidence
  @Field({ nullable: true })
  photoStoragePath?: string;

  @Field({ nullable: true, description: 'Signed read URL, 15 min TTL' })
  photoDownloadUrl?: string;

  @Field(() => Int, { nullable: true })
  timerSeconds?: number;

  @Field(() => Float, { nullable: true })
  quizScore?: number;
}
