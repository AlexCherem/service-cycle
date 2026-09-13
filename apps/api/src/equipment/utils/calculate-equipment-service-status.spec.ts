import { EquipmentServiceStatus } from '../dto/equipment-service-status.enum';
import {
  calculateEquipmentServiceStatus,
  createEquipmentServiceStatusWhere,
  getBusinessToday,
} from './calculate-equipment-service-status';

describe('getBusinessToday', () => {
  it.each([
    {
      now: new Date('2026-09-01T20:59:59.000Z'),
      expected: new Date('2026-09-01T00:00:00.000Z'),
    },
    {
      now: new Date('2026-09-01T21:00:00.000Z'),
      expected: new Date('2026-09-02T00:00:00.000Z'),
    },
  ])('returns Minsk business date for $now', ({ now, expected }) => {
    expect(getBusinessToday(now)).toEqual(expected);
  });
});

describe('calculateEquipmentServiceStatus', () => {
  const today = new Date('2026-09-02T00:00:00.000Z');

  it.each([
    {
      nextServiceDate: null,
      expected: EquipmentServiceStatus.UNSCHEDULED,
    },
    {
      nextServiceDate: new Date('2026-09-01T00:00:00.000Z'),
      expected: EquipmentServiceStatus.OVERDUE,
    },
    {
      nextServiceDate: new Date('2026-09-02T00:00:00.000Z'),
      expected: EquipmentServiceStatus.DUE_SOON,
    },
    {
      nextServiceDate: new Date('2026-10-02T00:00:00.000Z'),
      expected: EquipmentServiceStatus.DUE_SOON,
    },
    {
      nextServiceDate: new Date('2026-10-03T00:00:00.000Z'),
      expected: EquipmentServiceStatus.OK,
    },
  ])(
    'returns $expected for $nextServiceDate',
    ({ nextServiceDate, expected }) => {
      expect(calculateEquipmentServiceStatus(nextServiceDate, today)).toBe(
        expected,
      );
    },
  );
});

describe('createEquipmentServiceStatusWhere', () => {
  const today = new Date('2026-09-02T00:00:00.000Z');

  it.each([
    {
      status: EquipmentServiceStatus.OVERDUE,
      expected: {
        nextServiceDate: {
          lt: today,
        },
      },
    },
    {
      status: EquipmentServiceStatus.DUE_SOON,
      expected: {
        nextServiceDate: {
          gte: today,
          lte: new Date('2026-10-02T00:00:00.000Z'),
        },
      },
    },
    {
      status: EquipmentServiceStatus.OK,
      expected: {
        nextServiceDate: {
          gt: new Date('2026-10-02T00:00:00.000Z'),
        },
      },
    },
    {
      status: EquipmentServiceStatus.UNSCHEDULED,
      expected: {
        nextServiceDate: null,
      },
    },
  ])('returns Prisma filter for $status', ({ status, expected }) => {
    expect(createEquipmentServiceStatusWhere(status, today)).toEqual(expected);
  });
});
