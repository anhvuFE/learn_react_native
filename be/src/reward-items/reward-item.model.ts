import { Field, ID, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class RewardItem {
  @Field(() => ID)
  id!: string;

  @Field()
  familyId!: string;

  @Field()
  name!: string;

  @Field({ nullable: true })
  description?: string;

  @Field({ nullable: true })
  emoji?: string;

  @Field(() => Int)
  costPoints!: number;

  @Field(() => Int)
  stock!: number; // -1 = unlimited

  @Field()
  active!: boolean;

  @Field()
  createdAt!: string;
}

@ObjectType()
export class RewardRedemption {
  @Field(() => ID)
  id!: string;

  @Field()
  itemId!: string;

  @Field()
  itemName!: string;

  @Field(() => Int)
  costPoints!: number;

  @Field()
  childUid!: string;

  @Field()
  familyId!: string;

  @Field()
  status!: string; // pending|fulfilled|cancelled

  @Field()
  redeemedAt!: string;

  @Field({ nullable: true })
  fulfilledAt?: string;
}
