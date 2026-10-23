import type { UpdateEquipmentDto } from '@/shared/api/generated/models';

type ServiceDates = Pick<
  UpdateEquipmentDto,
  'installationDate' | 'lastServiceDate' | 'nextServiceDate'
>;

export function getEquipmentDateOrderError(
  field: keyof ServiceDates,
  dates: ServiceDates,
): string | undefined {
  const value = dates[field];
  if (!value) return;
  if (
    field === 'lastServiceDate' &&
    dates.installationDate &&
    value < dates.installationDate
  ) {
    return 'Дата последнего обслуживания не может быть раньше даты установки';
  }
  if (field === 'nextServiceDate') {
    const reference = dates.lastServiceDate || dates.installationDate;
    if (reference && value < reference) {
      return 'Дата следующего обслуживания не может быть раньше предыдущей даты';
    }
  }
}
