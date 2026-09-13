import { PrismaService } from '../database/prisma/prisma.service';
import { EquipmentServiceStatus } from './dto/equipment-service-status.enum';
import { EquipmentService } from './equipment.service';

type PrismaMock = {
  equipment: {
    findMany: jest.Mock;
    count: jest.Mock;
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
      },
      $transaction: jest.fn(),
    };

    equipmentService = new EquipmentService(prisma as unknown as PrismaService);
  });

  afterEach(() => {
    jest.useRealTimers();
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
