import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class UpdateProfileInput {
  @Field({ nullable: true })
  name?: string;
}

@InputType()
export class UpdateSettingsInput {
  @Field({ nullable: true })
  autoApproveQuiz?: boolean;

  @Field({ nullable: true })
  autoApproveWalk?: boolean;

  @Field({ nullable: true })
  requirePhotoApproval?: boolean;

  @Field({ nullable: true })
  notifyOnSubmit?: boolean;

  @Field({ nullable: true })
  autoLock?: boolean;

  @Field({ nullable: true })
  bedtimeMode?: boolean;
}
