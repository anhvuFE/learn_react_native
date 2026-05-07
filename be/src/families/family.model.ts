import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class Family {
  @Field(() => ID)
  id!: string;

  @Field()
  parentUid!: string;

  @Field(() => [String])
  childUids!: string[];

  @Field()
  createdAt!: string;
}
