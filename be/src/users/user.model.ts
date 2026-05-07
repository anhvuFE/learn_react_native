import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';

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

  @Field()
  createdAt!: string;
}
