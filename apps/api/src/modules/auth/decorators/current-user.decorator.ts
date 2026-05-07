import { type ExecutionContext, createParamDecorator } from '@nestjs/common';
import type { UserRole } from '@prisma/client';

export interface AuthenticatedUser {
  id: string;
  roles: UserRole[];
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
    return ctx.switchToHttp().getRequest().user as AuthenticatedUser;
  },
);
