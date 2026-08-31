import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Request, Response } from 'express';

import { AccessTokenGuard } from './access-token.guard';
import {
  ACCESS_TOKEN_COOKIE_NAME,
  ACCESS_TOKEN_TTL_SECONDS,
  REFRESH_TOKEN_COOKIE_NAME,
  REFRESH_TOKEN_TTL_SECONDS,
} from './auth.constants';
import { AuthService } from './auth.service';
import type { AuthenticatedRequest } from './authenticated-user.type';
import { AuthUserDto } from './dto/auth-user.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({
    summary: 'Зарегистрировать компанию и первого пользователя',
  })
  @ApiCreatedResponse({
    description: 'Компания и пользователь созданы',
    type: AuthUserDto,
  })
  @ApiBadRequestResponse({
    description: 'Некорректные данные регистрации',
  })
  @ApiConflictResponse({
    description: 'Пользователь с таким email уже существует',
  })
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthUserDto> {
    const { user, accessToken, refreshToken } =
      await this.authService.register(dto);

    this.setAuthCookies(response, accessToken, refreshToken);

    return user;
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Войти по email и паролю',
  })
  @ApiOkResponse({
    description: 'Пользователь успешно вошёл',
    type: AuthUserDto,
  })
  @ApiBadRequestResponse({
    description: 'Некорректные данные входа',
  })
  @ApiUnauthorizedResponse({
    description: 'Неверный email или пароль',
  })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthUserDto> {
    const { user, accessToken, refreshToken } =
      await this.authService.login(dto);

    this.setAuthCookies(response, accessToken, refreshToken);

    return user;
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Обновить access token',
  })
  @ApiOkResponse({
    description: 'Access token обновлён',
    type: AuthUserDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Сессия недействительна или истекла',
  })
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthUserDto> {
    const cookies = request.cookies as Record<string, unknown>;
    const refreshToken = cookies[REFRESH_TOKEN_COOKIE_NAME];

    if (typeof refreshToken !== 'string') {
      throw new UnauthorizedException('Сессия недействительна или истекла');
    }

    const { user, accessToken } = await this.authService.refresh(refreshToken);

    this.setAccessCookie(response, accessToken);

    return user;
  }

  @Get('me')
  @UseGuards(AccessTokenGuard)
  @ApiOperation({
    summary: 'Получить текущего пользователя',
  })
  @ApiOkResponse({
    description: 'Текущий пользователь',
    type: AuthUserDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Access token отсутствует или недействителен',
  })
  async me(@Req() request: AuthenticatedRequest): Promise<AuthUserDto> {
    return this.authService.getMe(request.user.userId);
  }

  private setAuthCookies(
    response: Response,
    accessToken: string,
    refreshToken: string,
  ): void {
    this.setAccessCookie(response, accessToken);

    response.cookie(REFRESH_TOKEN_COOKIE_NAME, refreshToken, {
      httpOnly: true,
      maxAge: REFRESH_TOKEN_TTL_SECONDS * 1000,
      path: '/auth',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });
  }

  private setAccessCookie(response: Response, accessToken: string): void {
    response.cookie(ACCESS_TOKEN_COOKIE_NAME, accessToken, {
      httpOnly: true,
      maxAge: ACCESS_TOKEN_TTL_SECONDS * 1000,
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });
  }
}
