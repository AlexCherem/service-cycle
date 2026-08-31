import { ConflictException, UnauthorizedException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { JwtService } from '@nestjs/jwt';
import { hash } from 'bcryptjs';

import type { PrismaService } from '../database/prisma/prisma.service';
import { Prisma } from '../generated/prisma/client';
import { REFRESH_TOKEN_TTL_SECONDS } from './auth.constants';
import { AuthService } from './auth.service';

jest.mock('@nestjs/jwt', () => ({
  JwtService: class JwtService {},
}));

type TransactionMock = {
  company: {
    create: jest.Mock;
  };
  user: {
    create: jest.Mock;
  };
  authSession: {
    create: jest.Mock;
  };
};

type PrismaMock = {
  user: {
    findUnique: jest.Mock;
  };
  authSession: {
    findUnique: jest.Mock;
  };
  $transaction: jest.Mock;
};

describe('AuthService', () => {
  let authService: AuthService;
  let prisma: PrismaMock;
  let transaction: TransactionMock;
  let jwtService: {
    signAsync: jest.Mock;
    verifyAsync: jest.Mock;
  };
  let configService: {
    getOrThrow: jest.Mock;
  };

  beforeEach(() => {
    transaction = {
      company: {
        create: jest.fn(),
      },
      user: {
        create: jest.fn(),
      },
      authSession: {
        create: jest.fn(),
      },
    };

    prisma = {
      user: {
        findUnique: jest.fn(),
      },
      authSession: {
        findUnique: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    jwtService = {
      signAsync: jest.fn(),
      verifyAsync: jest.fn(),
    };

    configService = {
      getOrThrow: jest.fn(),
    };

    prisma.$transaction.mockImplementation(
      async (
        callback: (transactionClient: TransactionMock) => Promise<unknown>,
      ) => callback(transaction),
    );

    authService = new AuthService(
      prisma as unknown as PrismaService,
      jwtService as unknown as JwtService,
      configService as unknown as ConfigService,
    );
  });

  it('creates company, user, session and tokens', async () => {
    const company = {
      id: '9deaed53-1de4-410a-8cb3-7b3c62030699',
    };

    const user = {
      id: '744bed01-03d7-4a75-89e2-d3642b455dbf',
      email: 'owner@example.com',
      companyId: company.id,
    };

    const session = {
      id: 'aa593f83-6336-402d-9169-dad2c9f9ed52',
    };

    transaction.company.create.mockResolvedValue(company);
    transaction.user.create.mockResolvedValue(user);
    transaction.authSession.create.mockResolvedValue(session);

    jwtService.signAsync
      .mockResolvedValueOnce('access-token')
      .mockResolvedValueOnce('refresh-token');

    configService.getOrThrow.mockReturnValue('refresh-secret');

    const result = await authService.register({
      companyName: ' ООО Рога и Копыта ',
      email: ' Owner@Example.com ',
      password: 'secure-password1',
    });

    expect(transaction.company.create).toHaveBeenCalledWith({
      data: {
        name: 'ООО Рога и Копыта',
      },
      select: {
        id: true,
      },
    });

    type UserCreateArgument = {
      data: {
        companyId: string;
        email: string;
        passwordHash: string;
      };
      select: {
        id: boolean;
        email: boolean;
        companyId: boolean;
      };
    };

    const userCreateCalls = transaction.user.create.mock.calls as Array<
      [UserCreateArgument]
    >;

    const userCreateArgument = userCreateCalls[0][0];

    expect(userCreateArgument).toEqual({
      data: {
        companyId: company.id,
        email: 'owner@example.com',
        passwordHash: userCreateArgument.data.passwordHash,
      },
      select: {
        id: true,
        email: true,
        companyId: true,
      },
    });

    expect(userCreateArgument.data.passwordHash).toMatch(/^\$2[aby]\$12\$/);
    expect(userCreateArgument.data.passwordHash).not.toBe('secure-password1');

    type SessionCreateArgument = {
      data: {
        userId: string;
        expiresAt: Date;
      };
      select: {
        id: boolean;
      };
    };

    const sessionCreateCalls = transaction.authSession.create.mock
      .calls as Array<[SessionCreateArgument]>;

    const sessionCreateArgument = sessionCreateCalls[0][0];

    expect(sessionCreateArgument).toEqual({
      data: {
        userId: user.id,
        expiresAt: sessionCreateArgument.data.expiresAt,
      },
      select: {
        id: true,
      },
    });

    expect(sessionCreateArgument.data.expiresAt).toBeInstanceOf(Date);

    expect(jwtService.signAsync).toHaveBeenNthCalledWith(1, {
      sub: user.id,
      companyId: user.companyId,
      type: 'access',
    });

    expect(jwtService.signAsync).toHaveBeenNthCalledWith(
      2,
      {
        sub: user.id,
        sessionId: session.id,
        type: 'refresh',
      },
      {
        secret: 'refresh-secret',
        expiresIn: REFRESH_TOKEN_TTL_SECONDS,
      },
    );

    expect(result).toEqual({
      user,
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });
  });

  it('throws ConflictException when email already exists', async () => {
    const prismaError = new Prisma.PrismaClientKnownRequestError(
      'Unique constraint failed',
      {
        code: 'P2002',
        clientVersion: '7.9.1',
        meta: {
          target: ['email'],
        },
      },
    );

    prisma.$transaction.mockRejectedValue(prismaError);

    await expect(
      authService.register({
        companyName: 'ООО Рога и Копыта',
        email: 'owner@example.com',
        password: 'secure-password1',
      }),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(jwtService.signAsync).not.toHaveBeenCalled();
  });

  it('logs in user with valid credentials', async () => {
    const password = 'secure-password1';

    const user = {
      id: '744bed01-03d7-4a75-89e2-d3642b455dbf',
      email: 'owner@example.com',
      companyId: '9deaed53-1de4-410a-8cb3-7b3c62030699',
      passwordHash: await hash(password, 4),
    };

    const session = {
      id: 'aa593f83-6336-402d-9169-dad2c9f9ed52',
    };

    prisma.user.findUnique.mockResolvedValue(user);
    transaction.authSession.create.mockResolvedValue(session);

    jwtService.signAsync
      .mockResolvedValueOnce('access-token')
      .mockResolvedValueOnce('refresh-token');

    configService.getOrThrow.mockReturnValue('refresh-secret');

    const result = await authService.login({
      email: ' Owner@Example.com ',
      password,
    });

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: {
        email: 'owner@example.com',
      },
      select: {
        id: true,
        email: true,
        companyId: true,
        passwordHash: true,
      },
    });

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(transaction.authSession.create).toHaveBeenCalledTimes(1);

    expect(result).toEqual({
      user: {
        id: user.id,
        email: user.email,
        companyId: user.companyId,
      },
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });
  });

  it('throws UnauthorizedException when user does not exist', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(
      authService.login({
        email: 'unknown@example.com',
        password: 'secure-password1',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(transaction.authSession.create).not.toHaveBeenCalled();
    expect(jwtService.signAsync).not.toHaveBeenCalled();
  });

  it('throws UnauthorizedException when password is incorrect', async () => {
    const user = {
      id: '744bed01-03d7-4a75-89e2-d3642b455dbf',
      email: 'owner@example.com',
      companyId: '9deaed53-1de4-410a-8cb3-7b3c62030699',
      passwordHash: await hash('secure-password1', 4),
    };

    prisma.user.findUnique.mockResolvedValue(user);

    await expect(
      authService.login({
        email: 'owner@example.com',
        password: 'wrong-password1',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(transaction.authSession.create).not.toHaveBeenCalled();
    expect(jwtService.signAsync).not.toHaveBeenCalled();
  });

  it('refreshes access token for valid session', async () => {
    const user = {
      id: '744bed01-03d7-4a75-89e2-d3642b455dbf',
      email: 'owner@example.com',
      companyId: '9deaed53-1de4-410a-8cb3-7b3c62030699',
    };

    const sessionId = 'aa593f83-6336-402d-9169-dad2c9f9ed52';

    configService.getOrThrow.mockReturnValue('refresh-secret');

    jwtService.verifyAsync.mockResolvedValue({
      sub: user.id,
      sessionId,
      type: 'refresh',
    });

    prisma.authSession.findUnique.mockResolvedValue({
      userId: user.id,
      expiresAt: new Date(Date.now() + 60_000),
      user,
    });

    jwtService.signAsync.mockResolvedValue('new-access-token');

    const result = await authService.refresh('refresh-token');

    expect(jwtService.verifyAsync).toHaveBeenCalledWith('refresh-token', {
      secret: 'refresh-secret',
    });

    expect(prisma.authSession.findUnique).toHaveBeenCalledWith({
      where: {
        id: sessionId,
      },
      select: {
        userId: true,
        expiresAt: true,
        user: {
          select: {
            id: true,
            email: true,
            companyId: true,
          },
        },
      },
    });

    expect(jwtService.signAsync).toHaveBeenCalledWith({
      sub: user.id,
      companyId: user.companyId,
      type: 'access',
    });

    expect(result).toEqual({
      user,
      accessToken: 'new-access-token',
    });
  });

  it('throws UnauthorizedException when refresh token is invalid', async () => {
    configService.getOrThrow.mockReturnValue('refresh-secret');
    jwtService.verifyAsync.mockRejectedValue(new Error('Invalid token'));

    await expect(
      authService.refresh('invalid-refresh-token'),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(jwtService.verifyAsync).toHaveBeenCalledWith(
      'invalid-refresh-token',
      {
        secret: 'refresh-secret',
      },
    );

    expect(prisma.authSession.findUnique).not.toHaveBeenCalled();
    expect(jwtService.signAsync).not.toHaveBeenCalled();
  });

  it('throws UnauthorizedException when auth session has expired', async () => {
    const user = {
      id: '744bed01-03d7-4a75-89e2-d3642b455dbf',
      email: 'owner@example.com',
      companyId: '9deaed53-1de4-410a-8cb3-7b3c62030699',
    };

    const sessionId = 'aa593f83-6336-402d-9169-dad2c9f9ed52';

    configService.getOrThrow.mockReturnValue('refresh-secret');

    jwtService.verifyAsync.mockResolvedValue({
      sub: user.id,
      sessionId,
      type: 'refresh',
    });

    prisma.authSession.findUnique.mockResolvedValue({
      userId: user.id,
      expiresAt: new Date(Date.now() - 60_000),
      user,
    });

    await expect(authService.refresh('refresh-token')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );

    expect(prisma.authSession.findUnique).toHaveBeenCalledWith({
      where: {
        id: sessionId,
      },
      select: {
        userId: true,
        expiresAt: true,
        user: {
          select: {
            id: true,
            email: true,
            companyId: true,
          },
        },
      },
    });

    expect(jwtService.signAsync).not.toHaveBeenCalled();
  });

  it('throws UnauthorizedException when session belongs to another user', async () => {
    const user = {
      id: '744bed01-03d7-4a75-89e2-d3642b455dbf',
      email: 'owner@example.com',
      companyId: '9deaed53-1de4-410a-8cb3-7b3c62030699',
    };

    const sessionId = 'aa593f83-6336-402d-9169-dad2c9f9ed52';

    configService.getOrThrow.mockReturnValue('refresh-secret');

    jwtService.verifyAsync.mockResolvedValue({
      sub: 'another-user-id',
      sessionId,
      type: 'refresh',
    });

    prisma.authSession.findUnique.mockResolvedValue({
      userId: user.id,
      expiresAt: new Date(Date.now() + 60_000),
      user,
    });

    await expect(authService.refresh('refresh-token')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );

    expect(prisma.authSession.findUnique).toHaveBeenCalledTimes(1);
    expect(jwtService.signAsync).not.toHaveBeenCalled();
  });
});
