import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

import { PrismaModule } from '../database/prisma/prisma.module';
import { AccessTokenGuard } from './access-token.guard';
import { ACCESS_TOKEN_TTL_SECONDS } from './auth.constants';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  imports: [
    PrismaModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const accessSecret =
          configService.getOrThrow<string>('JWT_ACCESS_SECRET');

        configService.getOrThrow<string>('JWT_REFRESH_SECRET');

        return {
          secret: accessSecret,
          signOptions: {
            expiresIn: ACCESS_TOKEN_TTL_SECONDS,
          },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, AccessTokenGuard],
  exports: [AccessTokenGuard, JwtModule],
})
export class AuthModule {}
