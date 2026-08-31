import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { ACCESS_TOKEN_COOKIE_NAME } from './auth.constants';
import type { AuthenticatedRequest } from './authenticated-user.type';

const INVALID_ACCESS_TOKEN_MESSAGE = 'Требуется действующий access token';

type AccessTokenPayload = {
  sub?: unknown;
  companyId?: unknown;
  type?: unknown;
};

@Injectable()
export class AccessTokenGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    const cookies = request.cookies as Record<string, unknown>;
    const accessToken = cookies[ACCESS_TOKEN_COOKIE_NAME];

    if (typeof accessToken !== 'string') {
      throw new UnauthorizedException(INVALID_ACCESS_TOKEN_MESSAGE);
    }

    let payload: AccessTokenPayload;

    try {
      payload =
        await this.jwtService.verifyAsync<AccessTokenPayload>(accessToken);
    } catch {
      throw new UnauthorizedException(INVALID_ACCESS_TOKEN_MESSAGE);
    }

    if (
      payload.type !== 'access' ||
      typeof payload.sub !== 'string' ||
      typeof payload.companyId !== 'string'
    ) {
      throw new UnauthorizedException(INVALID_ACCESS_TOKEN_MESSAGE);
    }

    request.user = {
      userId: payload.sub,
      companyId: payload.companyId,
    };

    return true;
  }
}
