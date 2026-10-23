import type {
  EquipmentDetailsResponseDto,
  UpdateEquipmentDto,
} from '@/shared/api/generated/models';

export function getEquipmentChanges(
  values: UpdateEquipmentDto,
  equipment: EquipmentDetailsResponseDto,
): UpdateEquipmentDto {
  const changes: UpdateEquipmentDto = {};
  if (values.name !== undefined && values.name.trim() !== equipment.name) {
    changes.name = values.name.trim();
  }
  const nullableFields = [
    'type',
    'manufacturer',
    'model',
    'serialNumber',
    'notes',
    'installationDate',
    'lastServiceDate',
    'nextServiceDate',
  ] as const;
  for (const field of nullableFields) {
    if (values[field] === undefined) continue;
    const value = values[field]?.trim() || null;
    if (value !== equipment[field]) changes[field] = value;
  }
  if (
    values.serviceIntervalMonths !== undefined &&
    values.serviceIntervalMonths !== equipment.serviceIntervalMonths
  ) {
    changes.serviceIntervalMonths = values.serviceIntervalMonths;
  }
  return changes;
}
