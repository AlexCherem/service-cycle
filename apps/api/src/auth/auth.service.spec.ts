import { ConflictException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { JwtService } from '@nestjs/jwt';

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
  $transaction: jest.Mock;
};

describe('AuthService', () => {
  let authService: AuthService;
  let prisma: PrismaMock;
  let transaction: TransactionMock;
  let jwtService: {
    signAsync: jest.Mock;
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
      $transaction: jest.fn(),
    };

    jwtService = {
      signAsync: jest.fn(),
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
});
