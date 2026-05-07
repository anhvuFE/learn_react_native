import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class AddRestrictedAppInput {
  @Field()
  appId!: string;

  @Field()
  name!: string;

  @Field({ nullable: true })
  packageName?: string;
}
