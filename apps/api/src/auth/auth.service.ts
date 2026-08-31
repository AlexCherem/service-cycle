import { ConflictException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { hash } from 'bcryptjs';

import { PrismaService } from '../database/prisma/prisma.service';
import { Prisma } from '../generated/prisma/client';
import { REFRESH_TOKEN_TTL_SECONDS } from './auth.constants';
import { AuthUserDto } from './dto/auth-user.dto';
import { RegisterDto } from './dto/register.dto';

const PASSWORD_HASH_ROUNDS = 12;

type AuthResult = {
  user: AuthUserDto;
  accessToken: string;
  refreshToken: string;
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
    const refreshExpiresAt = new Date(
      Date.now() + REFRESH_TOKEN_TTL_SECONDS * 1000,
    );

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
              secret:
                this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
              expiresIn: REFRESH_TOKEN_TTL_SECONDS,
            },
          ),
        ]);

        return {
          user,
          accessToken,
          refreshToken,
        };
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
}
