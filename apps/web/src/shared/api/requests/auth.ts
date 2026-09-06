import { apiRequest } from '../apiClient';
import type { AuthUserDto, LoginDto } from '../generated/models';

export function login(credentials: LoginDto): Promise<AuthUserDto> {
  return apiRequest<AuthUserDto>('/api/v1/auth/login', {
    json: credentials,
    method: 'POST',
    skipAuthRefresh: true,
  });
}

export function getCurrentUser(): Promise<AuthUserDto> {
  return apiRequest<AuthUserDto>('/api/v1/auth/me');
}
