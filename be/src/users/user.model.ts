import { Field, ID, Int, ObjectType, registerEnumType } from '@nestjs/graphql';

export enum UserRole {
  PARENT = 'parent',
  CHILD = 'child',
}

registerEnumType(UserRole, { name: 'UserRole' });

@ObjectType()
export class User {
  @Field(() => ID)
  uid!: string;

  @Field({ nullable: true })
  email?: string;

  @Field({ nullable: true })
  name?: string;

  @Field(() => UserRole)
  role!: UserRole;

  @Field({ nullable: true })
  familyId?: string;

  @Field({ nullable: true })
  parentUid?: string;

  @Field({ nullable: true })
  pushToken?: string;

  @Field({ nullable: true })
  webPushToken?: string;

  @Field({ nullable: true, description: 'Storage path of avatar' })
  photoStoragePath?: string;

  @Field({ nullable: true, defaultValue: true })
  autoApproveQuiz?: boolean;

  @Field({ nullable: true, defaultValue: true })
  autoApproveWalk?: boolean;

  @Field({ nullable: true, defaultValue: true })
  requirePhotoApproval?: boolean;

  @Field({ nullable: true, defaultValue: true })
  notifyOnSubmit?: boolean;

  @Field({ nullable: true, defaultValue: true })
  autoLock?: boolean;

  @Field({ nullable: true, defaultValue: false })
  bedtimeMode?: boolean;

  @Field(() => Int, {
    nullable: true,
    description: 'Daily screen-time cap (minutes). null = no cap.',
  })
  dailyScreenTimeCapMin?: number;

  @Field()
  createdAt!: string;
}
