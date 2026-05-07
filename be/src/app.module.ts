import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { join } from 'path';
import { AuthModule } from './auth/auth.module';
import { FamiliesModule } from './families/families.module';
import { FirebaseModule } from './firebase/firebase.module';
import { PairingModule } from './pairing/pairing.module';
import { RewardsModule } from './rewards/rewards.module';
import { StorageModule } from './storage/storage.module';
import { SubmissionsModule } from './submissions/submissions.module';
import { TasksModule } from './tasks/tasks.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      sortSchema: true,
      playground: true,
      introspection: true,
      context: ({ req }: { req: unknown }) => ({ req }),
    }),
    FirebaseModule,
    StorageModule,
    UsersModule,
    FamiliesModule,
    AuthModule,
    PairingModule,
    TasksModule,
    RewardsModule,
    SubmissionsModule,
  ],
})
export class AppModule {}
