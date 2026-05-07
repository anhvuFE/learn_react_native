import { Field, InputType, Int } from '@nestjs/graphql';

@InputType()
export class CreateRewardItemInput {
  @Field()
  name!: string;

  @Field({ nullable: true })
  description?: string;

  @Field({ nullable: true })
  emoji?: string;

  @Field(() => Int)
  costPoints!: number;

  @Field(() => Int, { defaultValue: -1 })
  stock!: number;
}

@InputType()
export class UpdateRewardItemInput {
  @Field({ nullable: true })
  name?: string;

  @Field({ nullable: true })
  description?: string;

  @Field({ nullable: true })
  emoji?: string;

  @Field(() => Int, { nullable: true })
  costPoints?: number;

  @Field(() => Int, { nullable: true })
  stock?: number;

  @Field({ nullable: true })
  active?: boolean;
}
