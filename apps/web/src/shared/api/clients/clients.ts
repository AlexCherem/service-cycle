import { apiRequest } from '../apiClient';
import type {
  ClientListItemDto,
  ClientsControllerFindAllV1Params,
  CreateClientDto,
  ListClientsResponseDto,
  UpdateClientDto,
} from '../generated/models';

export function getClients(
  companyId: string,
  params: ClientsControllerFindAllV1Params,
  signal?: AbortSignal,
) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') query.set(key, String(value));
  });
  return apiRequest<ListClientsResponseDto>(
    `/api/v1/companies/${companyId}/clients?${query}`,
    { signal },
  );
}

export function getClient(clientId: string, signal?: AbortSignal) {
  return apiRequest<ClientListItemDto>(`/api/v1/clients/${clientId}`, {
    signal,
  });
}

export function createClient(data: CreateClientDto) {
  return apiRequest<ClientListItemDto>('/api/v1/clients', {
    method: 'POST',
    json: data,
  });
}

export function updateClient(clientId: string, data: UpdateClientDto) {
  return apiRequest<ClientListItemDto>(`/api/v1/clients/${clientId}`, {
    method: 'PATCH',
    json: data,
  });
}
