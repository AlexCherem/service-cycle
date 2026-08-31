import { type ExecutionContext, UnauthorizedException } from '@nestjs/common';
import type { JwtService } from '@nestjs/jwt';

import { AccessTokenGuard } from './access-token.guard';
import { ACCESS_TOKEN_COOKIE_NAME } from './auth.constants';
import type { AuthenticatedUser } from './authenticated-user.type';

jest.mock('@nestjs/jwt', () => ({
  JwtService: class JwtService {},
}));

type RequestMock = {
  cookies: Record<string, unknown>;
  user?: AuthenticatedUser;
};

describe('AccessTokenGuard', () => {
  let guard: AccessTokenGuard;
  let jwtService: {
    verifyAsync: jest.Mock;
  };
  let request: RequestMock;
  let context: ExecutionContext;

  beforeEach(() => {
    jwtService = {
      verifyAsync: jest.fn(),
    };

    request = {
      cookies: {},
    };

    context = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(request),
      }),
    } as unknown as ExecutionContext;

    guard = new AccessTokenGuard(jwtService as unknown as JwtService);
  });

  it('allows request with valid access token', async () => {
    request.cookies[ACCESS_TOKEN_COOKIE_NAME] = 'access-token';

    jwtService.verifyAsync.mockResolvedValue({
      sub: '744bed01-03d7-4a75-89e2-d3642b455dbf',
      companyId: '9deaed53-1de4-410a-8cb3-7b3c62030699',
      type: 'access',
    });

    const result = await guard.canActivate(context);

    expect(jwtService.verifyAsync).toHaveBeenCalledWith('access-token');

    expect(request.user).toEqual({
      userId: '744bed01-03d7-4a75-89e2-d3642b455dbf',
      companyId: '9deaed53-1de4-410a-8cb3-7b3c62030699',
    });

    expect(result).toBe(true);
  });

  it('throws UnauthorizedException when access cookie is missing', async () => {
    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );

    expect(jwtService.verifyAsync).not.toHaveBeenCalled();
    expect(request.user).toBeUndefined();
  });

  it('throws UnauthorizedException when access token is invalid', async () => {
    request.cookies[ACCESS_TOKEN_COOKIE_NAME] = 'invalid-access-token';

    jwtService.verifyAsync.mockRejectedValue(
      new Error('Invalid or expired token'),
    );

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );

    expect(jwtService.verifyAsync).toHaveBeenCalledWith('invalid-access-token');

    expect(request.user).toBeUndefined();
  });

  it('throws UnauthorizedException when token type is not access', async () => {
    request.cookies[ACCESS_TOKEN_COOKIE_NAME] = 'refresh-token';

    jwtService.verifyAsync.mockResolvedValue({
      sub: '744bed01-03d7-4a75-89e2-d3642b455dbf',
      companyId: '9deaed53-1de4-410a-8cb3-7b3c62030699',
      type: 'refresh',
    });

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );

    expect(jwtService.verifyAsync).toHaveBeenCalledWith('refresh-token');

    expect(request.user).toBeUndefined();
  });
});
