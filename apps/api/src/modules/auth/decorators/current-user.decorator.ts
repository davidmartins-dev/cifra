import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { PublicUser } from '../auth.service.js';

export const CurrentUser = createParamDecorator(
  (data: keyof PublicUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request & { user?: PublicUser }>();
    const user = request.user;

    return data && user ? user[data] : user;
  },
);
