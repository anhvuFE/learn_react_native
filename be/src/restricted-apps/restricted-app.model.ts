import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class RestrictedApp {
  @Field(() => ID)
  id!: string;

  @Field()
  familyId!: string;

  @Field({ description: 'Stable identifier (used for icon lookup)' })
  appId!: string;

  @Field()
  name!: string;

  @Field({ nullable: true })
  packageName?: string;

  @Field()
  createdAt!: string;
}
