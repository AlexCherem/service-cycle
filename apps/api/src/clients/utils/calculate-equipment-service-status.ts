import type { Prisma } from '../../generated/prisma/client';
import { EquipmentServiceStatus } from '../dto/equipment-service-status.enum';

const BUSINESS_TIME_ZONE = 'Europe/Minsk';

const businessDateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: BUSINESS_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

export const getBusinessToday = (now: Date = new Date()): Date => {
  const parts = businessDateFormatter.formatToParts(now);
  const year = Number(parts.find(({ type }) => type === 'year')?.value);
  const month = Number(parts.find(({ type }) => type === 'month')?.value);
  const day = Number(parts.find(({ type }) => type === 'day')?.value);

  return new Date(Date.UTC(year, month - 1, day));
};
export const DUE_SOON_DAYS = 30;

const getDueSoonUntil = (today: Date): Date => {
  const dueSoonUntil = new Date(today);

  dueSoonUntil.setUTCDate(dueSoonUntil.getUTCDate() + DUE_SOON_DAYS);

  return dueSoonUntil;
};

export const createEquipmentServiceStatusWhere = (
  status: EquipmentServiceStatus,
  today: Date,
): Prisma.EquipmentWhereInput => {
  const dueSoonUntil = getDueSoonUntil(today);

  switch (status) {
    case EquipmentServiceStatus.OVERDUE:
      return {
        nextServiceDate: {
          lt: today,
        },
      };

    case EquipmentServiceStatus.DUE_SOON:
      return {
        nextServiceDate: {
          gte: today,
          lte: dueSoonUntil,
        },
      };

    case EquipmentServiceStatus.OK:
      return {
        nextServiceDate: {
          gt: dueSoonUntil,
        },
      };

    case EquipmentServiceStatus.UNSCHEDULED:
      return {
        nextServiceDate: null,
      };
  }
};

export const calculateEquipmentServiceStatus = (
  nextServiceDate: Date | null,
  today: Date,
): EquipmentServiceStatus => {
  if (!nextServiceDate) {
    return EquipmentServiceStatus.UNSCHEDULED;
  }

  if (nextServiceDate < today) {
    return EquipmentServiceStatus.OVERDUE;
  }

  const dueSoonUntil = getDueSoonUntil(today);

  if (nextServiceDate <= dueSoonUntil) {
    return EquipmentServiceStatus.DUE_SOON;
  }

  return EquipmentServiceStatus.OK;
};
