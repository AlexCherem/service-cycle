import { BadRequestException, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../database/prisma/prisma.service';
import { Prisma } from '../generated/prisma/client';
import { EquipmentServiceStatus } from './dto/equipment-service-status.enum';
import { EquipmentService } from './equipment.service';

type PrismaMock = {
  equipment: {
    findMany: jest.Mock;
    count: jest.Mock;
    findFirst: jest.Mock;
    update: jest.Mock;
  };
  $transaction: jest.Mock;
};

describe('EquipmentService', () => {
  let equipmentService: EquipmentService;
  let prisma: PrismaMock;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-09-02T12:00:00.000Z'));

    prisma = {
      equipment: {
        findMany: jest.fn(),
        count: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest
        .fn()
        .mockImplementation(
          (
            callback: (
              transaction: Pick<PrismaMock, 'equipment'>,
            ) => Promise<unknown>,
          ) => callback(prisma),
        ),
    };

    equipmentService = new EquipmentService(prisma as unknown as PrismaService);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('updates allowed fields with tenant scope and returns recalculated details', async () => {
    const stored = {
      id: 'equipment-a',
      name: 'Кондиционер',
      type: null,
      manufacturer: 'Daikin',
      model: null,
      serialNumber: '001',
      serviceIntervalMonths: 12,
      notes: null,
      installationDate: new Date('2024-01-01T00:00:00.000Z'),
      lastServiceDate: null,
      nextServiceDate: new Date('2026-09-15T00:00:00.000Z'),
      client: { id: 'client-a', name: 'Иван' },
    };
    prisma.equipment.update.mockResolvedValue(stored);
    const result = await equipmentService.update('company-a', 'equipment-a', {
      name: 'Кондиционер',
      notes: null,
      nextServiceDate: '2026-09-15',
    });
    expect(prisma.equipment.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: 'equipment-a',
          companyId: 'company-a',
          client: { companyId: 'company-a' },
        },
        data: {
          name: 'Кондиционер',
          type: undefined,
          manufacturer: undefined,
          model: undefined,
          serialNumber: undefined,
          serviceIntervalMonths: undefined,
          notes: null,
          installationDate: undefined,
          lastServiceDate: undefined,
          nextServiceDate: new Date('2026-09-15T00:00:00.000Z'),
        },
      }),
    );
    expect(result).toEqual({
      ...stored,
      installationDate: '2024-01-01',
      nextServiceDate: '2026-09-15',
      status: EquipmentServiceStatus.DUE_SOON,
    });
  });

  it('clears a service date with null and returns UNSCHEDULED', async () => {
    prisma.equipment.update.mockResolvedValue({
      id: 'equipment-a',
      installationDate: null,
      lastServiceDate: null,
      nextServiceDate: null,
    });
    const result = await equipmentService.update('company-a', 'equipment-a', {
      nextServiceDate: null,
    });
    expect(result.nextServiceDate).toBeNull();
    expect(result.status).toBe(EquipmentServiceStatus.UNSCHEDULED);
    const args = prisma.equipment.update.mock.calls[0] as [
      { data: { nextServiceDate: unknown } },
    ];
    expect(args[0].data.nextServiceDate).toBeNull();
  });

  it('maps an update outside tenant scope to not found', async () => {
    prisma.equipment.update.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('not found', {
        code: 'P2025',
        clientVersion: 'test',
      }),
    );
    await expect(
      equipmentService.update('other-company', 'equipment-a', {
        notes: 'changed',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('does not hide unexpected update errors', async () => {
    const failure = new Error('database unavailable');
    prisma.equipment.update.mockRejectedValue(failure);
    await expect(
      equipmentService.update('company-a', 'equipment-a', { notes: 'changed' }),
    ).rejects.toBe(failure);
  });

  it.each([
    ['2026-09-15', '2026-09-14', null],
    ['2026-09-15', null, '2026-09-14'],
    ['2026-09-01', '2026-09-15', '2026-09-14'],
  ])(
    'rejects inconsistent final dates: %s, %s, %s',
    async (installation, last, next) => {
      prisma.equipment.update.mockResolvedValue({
        installationDate: installation ? new Date(installation) : null,
        lastServiceDate: last ? new Date(last) : null,
        nextServiceDate: next ? new Date(next) : null,
      });
      // Only one field was supplied; validation must also consider stored dates.
      await expect(
        equipmentService.update('company-a', 'equipment-a', {
          nextServiceDate: next,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    },
  );

  it.each([
    ['2026-09-15', '2026-09-15', '2026-09-15'],
    ['2026-09-15', null, '2026-09-16'],
    [null, '2026-09-15', '2026-09-16'],
    [null, null, null],
  ])(
    'accepts equal, ordered and cleared dates: %s, %s, %s',
    async (installation, last, next) => {
      prisma.equipment.update.mockResolvedValue({
        installationDate: installation ? new Date(installation) : null,
        lastServiceDate: last ? new Date(last) : null,
        nextServiceDate: next ? new Date(next) : null,
      });
      await expect(
        equipmentService.update('company-a', 'equipment-a', {
          installationDate: installation,
          lastServiceDate: last,
          nextServiceDate: next,
        }),
      ).resolves.toMatchObject({
        installationDate: installation,
        lastServiceDate: last,
        nextServiceDate: next,
      });
    },
  );

  it('returns equipment details scoped to the company', async () => {
    const companyId = '7cfad2ad-8c32-4614-bd68-4882d7998655';
    const equipmentId = '960ae682-3486-4fd5-8709-76b650582f84';

    prisma.equipment.findFirst.mockResolvedValue({
      id: equipmentId,
      name: 'Газовый котёл',
      type: 'Котёл',
      manufacturer: 'Bosch',
      model: 'Gaz 6000 W',
      serialNumber: 'SN-123456',
      serviceIntervalMonths: 12,
      notes: 'Установлен в котельной',
      installationDate: new Date('2024-09-15T00:00:00.000Z'),
      lastServiceDate: new Date('2025-09-15T00:00:00.000Z'),
      nextServiceDate: new Date('2026-09-15T00:00:00.000Z'),
      client: {
        id: '8810c8d6-67ee-49bd-82c8-4cd4865e9ac5',
        name: 'Иван Иванов',
      },
    });

    const result = await equipmentService.findOne(companyId, equipmentId);

    expect(prisma.equipment.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: equipmentId,
          companyId,
          client: {
            companyId,
          },
        },
      }),
    );

    expect(result).toEqual({
      id: equipmentId,
      name: 'Газовый котёл',
      type: 'Котёл',
      manufacturer: 'Bosch',
      model: 'Gaz 6000 W',
      serialNumber: 'SN-123456',
      serviceIntervalMonths: 12,
      notes: 'Установлен в котельной',
      installationDate: '2024-09-15',
      lastServiceDate: '2025-09-15',
      nextServiceDate: '2026-09-15',
      status: EquipmentServiceStatus.DUE_SOON,
      client: {
        id: '8810c8d6-67ee-49bd-82c8-4cd4865e9ac5',
        name: 'Иван Иванов',
      },
    });
  });

  it('throws NotFoundException when no equipment matches the tenant filter', async () => {
    prisma.equipment.findFirst.mockResolvedValue(null);

    await expect(
      equipmentService.findOne(
        '7cfad2ad-8c32-4614-bd68-4882d7998655',
        '960ae682-3486-4fd5-8709-76b650582f84',
      ),
    ).rejects.toThrow(NotFoundException);
  });

  it('preserves null fields and returns UNSCHEDULED without a service date', async () => {
    const companyId = '7cfad2ad-8c32-4614-bd68-4882d7998655';
    const equipmentId = '960ae682-3486-4fd5-8709-76b650582f84';

    const equipment = {
      id: equipmentId,
      name: 'Газовый котёл',
      type: null,
      manufacturer: null,
      model: null,
      serialNumber: null,
      serviceIntervalMonths: null,
      notes: null,
      installationDate: null,
      lastServiceDate: null,
      nextServiceDate: null,
      client: {
        id: '8810c8d6-67ee-49bd-82c8-4cd4865e9ac5',
        name: 'Иван Иванов',
      },
    };

    prisma.equipment.findFirst.mockResolvedValue(equipment);

    const result = await equipmentService.findOne(companyId, equipmentId);

    expect(result).toEqual({
      ...equipment,
      status: EquipmentServiceStatus.UNSCHEDULED,
    });
  });

  it('returns paginated equipment for the requested company', async () => {
    const companyId = '7cfad2ad-8c32-4614-bd68-4882d7998655';

    const equipment = [
      {
        id: '960ae682-3486-4fd5-8709-76b650582f84',
        name: 'Газовый котёл',
        installationDate: new Date('2024-02-07T00:00:00.000Z'),
        lastServiceDate: new Date('2025-02-07T00:00:00.000Z'),
        nextServiceDate: new Date('2027-02-07T00:00:00.000Z'),
        client: {
          id: '8810c8d6-67ee-49bd-82c8-4cd4865e9ac5',
          name: 'Иван Иванов',
        },
      },
    ];

    prisma.equipment.findMany.mockResolvedValue(equipment);
    prisma.equipment.count.mockResolvedValue(5);
    prisma.$transaction.mockResolvedValue([equipment, 5]);

    const result = await equipmentService.findAll(companyId, {
      page: 2,
      limit: 2,
    });

    expect(prisma.equipment.findMany).toHaveBeenCalledWith({
      where: {
        companyId,
      },
      select: {
        id: true,
        name: true,
        installationDate: true,
        lastServiceDate: true,
        nextServiceDate: true,
        client: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [
        {
          nextServiceDate: 'asc',
        },
        {
          name: 'asc',
        },
        {
          id: 'asc',
        },
      ],
      skip: 2,
      take: 2,
    });

    expect(prisma.equipment.count).toHaveBeenCalledWith({
      where: {
        companyId,
      },
    });

    expect(result).toEqual({
      items: [
        {
          id: '960ae682-3486-4fd5-8709-76b650582f84',
          name: 'Газовый котёл',
          installationDate: '2024-02-07',
          lastServiceDate: '2025-02-07',
          nextServiceDate: '2027-02-07',
          status: EquipmentServiceStatus.OK,
          client: {
            id: '8810c8d6-67ee-49bd-82c8-4cd4865e9ac5',
            name: 'Иван Иванов',
          },
        },
      ],
      total: 5,
      page: 2,
      limit: 2,
    });
  });

  it('combines company, client, search and status filters', async () => {
    const companyId = '7cfad2ad-8c32-4614-bd68-4882d7998655';
    const clientId = '8810c8d6-67ee-49bd-82c8-4cd4865e9ac5';

    prisma.equipment.findMany.mockResolvedValue([]);
    prisma.equipment.count.mockResolvedValue(0);
    prisma.$transaction.mockResolvedValue([[], 0]);

    await equipmentService.findAll(companyId, {
      page: 1,
      limit: 20,
      search: '  Иван  ',
      status: EquipmentServiceStatus.DUE_SOON,
      clientId,
    });

    const where = {
      companyId,
      nextServiceDate: {
        gte: new Date('2026-09-02T00:00:00.000Z'),
        lte: new Date('2026-10-02T00:00:00.000Z'),
      },
      clientId,
      OR: [
        {
          name: {
            contains: 'Иван',
            mode: 'insensitive',
          },
        },
        {
          client: {
            name: {
              contains: 'Иван',
              mode: 'insensitive',
            },
          },
        },
      ],
    };

    expect(prisma.equipment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where,
        skip: 0,
        take: 20,
      }),
    );

    expect(prisma.equipment.count).toHaveBeenCalledWith({
      where,
    });
  });
});
