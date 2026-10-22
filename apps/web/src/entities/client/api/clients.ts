import { apiRequest } from '@/shared/api';
import type {
  ClientListItemDto,
  ClientsControllerFindAllV1Params,
  ListClientsResponseDto,
} from '@/shared/api/generated/models';

export const clientsQueryKey = (companyId: string) =>
  ['clients', companyId] as const;

export const clientDetailsQueryKey = (
  companyId: string,
  clientId: string | null,
) => [...clientsQueryKey(companyId), 'detail', clientId] as const;

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
