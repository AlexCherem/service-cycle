import type { EquipmentServiceStatus } from '@/shared/api/generated/models';

export const equipmentServiceStatuses: Record<
  EquipmentServiceStatus,
  { label: string; color: string }
> = {
  OK: { label: 'Срок не наступил', color: 'green' },
  DUE_SOON: { label: 'Скоро обслуживание', color: 'gold' },
  OVERDUE: { label: 'Просрочено', color: 'red' },
  UNSCHEDULED: { label: 'Дата не назначена', color: 'default' },
};
