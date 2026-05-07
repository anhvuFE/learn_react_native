import { Field, ObjectType } from '@nestjs/graphql';
import { User } from '../users/user.model';

@ObjectType()
export class PairingCode {
  @Field()
  code!: string;

  @Field()
  expiresAt!: string;

  @Field()
  childName!: string;
}

@ObjectType()
export class PairingResult {
  @Field({ description: 'Firebase custom token — sign in with signInWithCustomToken()' })
  customToken!: string;

  @Field(() => User)
  child!: User;
}
