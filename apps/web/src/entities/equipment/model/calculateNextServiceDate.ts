import dayjs from 'dayjs';

import type { UpdateEquipmentDto } from '@/shared/api/generated/models';

type ServiceSchedule = Pick<
  UpdateEquipmentDto,
  'installationDate' | 'lastServiceDate' | 'serviceIntervalMonths'
>;

export function calculateNextServiceDate({
  installationDate,
  lastServiceDate,
  serviceIntervalMonths,
}: ServiceSchedule): string | undefined {
  const reference = lastServiceDate || installationDate;
  if (
    !reference ||
    serviceIntervalMonths == null ||
    !Number.isInteger(serviceIntervalMonths) ||
    serviceIntervalMonths < 1 ||
    serviceIntervalMonths > 2147483647
  )
    return undefined;

  const date = dayjs(reference);
  if (!date.isValid() || date.format('YYYY-MM-DD') !== reference)
    return undefined;

  const next = date.add(serviceIntervalMonths, 'month');
  if (!next.isValid() || next.year() > 9999) return undefined;
  return next.format('YYYY-MM-DD');
}
