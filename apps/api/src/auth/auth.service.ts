import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcryptjs';

import { PrismaService } from '../database/prisma/prisma.service';
import { Prisma } from '../generated/prisma/client';
import { REFRESH_TOKEN_TTL_SECONDS } from './auth.constants';
import { AuthUserDto } from './dto/auth-user.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

const PASSWORD_HASH_ROUNDS = 12;
const INVALID_CREDENTIALS_MESSAGE = 'Неверный email или пароль';
const INVALID_REFRESH_TOKEN_MESSAGE = 'Сессия недействительна или истекла';

type AuthResult = {
  user: AuthUserDto;
  accessToken: string;
  refreshToken: string;
};

type RefreshResult = {
  user: AuthUserDto;
  accessToken: string;
};

type RefreshTokenPayload = {
  sub?: unknown;
  sessionId?: unknown;
  type?: unknown;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResult> {
    const email = dto.email.trim().toLowerCase();
    const companyName = dto.companyName.trim();
    const passwordHash = await hash(dto.password, PASSWORD_HASH_ROUNDS);

    try {
      return await this.prisma.$transaction(async (transaction) => {
        const company = await transaction.company.create({
          data: {
            name: companyName,
          },
          select: {
            id: true,
          },
        });

        const user = await transaction.user.create({
          data: {
            companyId: company.id,
            email,
            passwordHash,
          },
          select: {
            id: true,
            email: true,
            companyId: true,
          },
        });

        return this.createSessionAndTokens(transaction, user);
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'Пользователь с таким email уже существует',
        );
      }

      throw error;
    }
  }

  async login(dto: LoginDto): Promise<AuthResult> {
    const email = dto.email.trim().toLowerCase();

    const user = await this.prisma.user.findUnique({
      where: {
        email,
      },
      select: {
        id: true,
        email: true,
        companyId: true,
        passwordHash: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException(INVALID_CREDENTIALS_MESSAGE);
    }

    const passwordMatches = await compare(dto.password, user.passwordHash);

    if (!passwordMatches) {
      throw new UnauthorizedException(INVALID_CREDENTIALS_MESSAGE);
    }

    const authUser: AuthUserDto = {
      id: user.id,
      email: user.email,
      companyId: user.companyId,
    };

    return this.prisma.$transaction((transaction) =>
      this.createSessionAndTokens(transaction, authUser),
    );
  }

  async refresh(refreshToken: string): Promise<RefreshResult> {
    const refreshSecret =
      this.configService.getOrThrow<string>('JWT_REFRESH_SECRET');

    let payload: RefreshTokenPayload;

    try {
      payload = await this.jwtService.verifyAsync<RefreshTokenPayload>(
        refreshToken,
        {
          secret: refreshSecret,
        },
      );
    } catch {
      throw new UnauthorizedException(INVALID_REFRESH_TOKEN_MESSAGE);
    }

    if (
      payload.type !== 'refresh' ||
      typeof payload.sub !== 'string' ||
      typeof payload.sessionId !== 'string'
    ) {
      throw new UnauthorizedException(INVALID_REFRESH_TOKEN_MESSAGE);
    }

    const session = await this.prisma.authSession.findUnique({
      where: {
        id: payload.sessionId,
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

    if (
      !session ||
      session.userId !== payload.sub ||
      session.expiresAt <= new Date()
    ) {
      throw new UnauthorizedException(INVALID_REFRESH_TOKEN_MESSAGE);
    }

    const accessToken = await this.jwtService.signAsync({
      sub: session.user.id,
      companyId: session.user.companyId,
      type: 'access',
    });

    return {
      user: session.user,
      accessToken,
    };
  }

  async getMe(userId: string): Promise<AuthUserDto> {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        email: true,
        companyId: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Пользователь больше не существует');
    }

    return user;
  }

  private async createSessionAndTokens(
    transaction: Prisma.TransactionClient,
    user: AuthUserDto,
  ): Promise<AuthResult> {
    const refreshExpiresAt = new Date(
      Date.now() + REFRESH_TOKEN_TTL_SECONDS * 1000,
    );

    const session = await transaction.authSession.create({
      data: {
        userId: user.id,
        expiresAt: refreshExpiresAt,
      },
      select: {
        id: true,
      },
    });

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync({
        sub: user.id,
        companyId: user.companyId,
        type: 'access',
      }),
      this.jwtService.signAsync(
        {
          sub: user.id,
          sessionId: session.id,
          type: 'refresh',
        },
        {
          secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
          expiresIn: REFRESH_TOKEN_TTL_SECONDS,
        },
      ),
    ]);

    return {
      user,
      accessToken,
      refreshToken,
    };
  }
}
