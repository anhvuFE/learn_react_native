import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import type { User } from '../../users/user.model';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): User | null => {
    const gqlCtx = GqlExecutionContext.create(ctx).getContext();
    return (gqlCtx.user as User) ?? null;
  },
);
