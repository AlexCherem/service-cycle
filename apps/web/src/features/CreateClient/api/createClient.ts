import { apiRequest } from '@/shared/api';
import type {
  ClientListItemDto,
  CreateClientDto,
} from '@/shared/api/generated/models';

export function createClient(data: CreateClientDto) {
  return apiRequest<ClientListItemDto>('/api/v1/clients', {
    method: 'POST',
    json: data,
  });
}
