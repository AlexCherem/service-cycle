import { apiRequest } from '@/shared/api';
import type {
  ClientListItemDto,
  UpdateClientDto,
} from '@/shared/api/generated/models';

export const editClientMutationKey = (
  companyId: string,
  clientId: string | null,
) => ['edit-client', companyId, clientId] as const;

export function updateClient(clientId: string, data: UpdateClientDto) {
  return apiRequest<ClientListItemDto>(`/api/v1/clients/${clientId}`, {
    method: 'PATCH',
    json: data,
  });
}
