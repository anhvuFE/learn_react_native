import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class PairChildDeviceInput {
  @Field({ nullable: true })
  platform?: string;

  @Field({ nullable: true })
  model?: string;
}
