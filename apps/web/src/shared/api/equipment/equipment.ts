import { apiRequest } from '../apiClient';
import type {
  EquipmentControllerFindAllV1Params,
  EquipmentDetailsResponseDto,
  ListEquipmentResponseDto,
} from '../generated/models';

export function getEquipment(
  params: EquipmentControllerFindAllV1Params,
  signal?: AbortSignal,
) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') query.set(key, String(value));
  });

  return apiRequest<ListEquipmentResponseDto>(`/api/v1/equipment?${query}`, {
    signal,
  });
}

export function getEquipmentById(equipmentId: string, signal?: AbortSignal) {
  return apiRequest<EquipmentDetailsResponseDto>(
    `/api/v1/equipment/${equipmentId}`,
    { signal },
  );
}
