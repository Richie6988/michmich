import { ExecutionContext, Injectable, createParamDecorator } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { User } from '../../users/entities/user.entity';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): User => {
    const req = ctx.switchToHttp().getRequest();
    return req.user;
  },
);
