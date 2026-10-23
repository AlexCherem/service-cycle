import { apiRequest } from '../apiClient';
import type { AuthUserDto, LoginDto, RegisterDto } from '../generated/models';

export function login(credentials: LoginDto): Promise<AuthUserDto> {
  return apiRequest<AuthUserDto>('/api/v1/auth/login', {
    json: credentials,
    method: 'POST',
    skipAuthRefresh: true,
  });
}

export function register(data: RegisterDto): Promise<AuthUserDto> {
  return apiRequest<AuthUserDto>('/api/v1/auth/register', {
    json: data,
    method: 'POST',
    skipAuthRefresh: true,
  });
}

export function getCurrentUser(): Promise<AuthUserDto> {
  return apiRequest<AuthUserDto>('/api/v1/auth/me');
}
