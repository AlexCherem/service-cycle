import { ConflictException, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../database/prisma/prisma.service';
import { EquipmentServiceStatus } from '../equipment/dto/equipment-service-status.enum';
import { Prisma } from '../generated/prisma/client';
import { ClientsService } from './clients.service';
import type { CreateClientDto } from './dto/create-client.dto';

type PrismaMock = {
  company: {
    findUnique: jest.Mock;
  };
  client: {
    create: jest.Mock;
    findFirst: jest.Mock;
    findMany: jest.Mock;
    count: jest.Mock;
    update: jest.Mock;
  };
  $transaction: jest.Mock;
};

describe('ClientsService', () => {
  let clientsService: ClientsService;
  let prisma: PrismaMock;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-09-02T12:00:00.000Z'));

    prisma = {
      company: {
        findUnique: jest.fn(),
      },
      client: {
        create: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    clientsService = new ClientsService(prisma as unknown as PrismaService);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('create', () => {
    const companyId = '7cfad2ad-8c32-4614-bd68-4882d7998655';
    const clientId = '8810c8d6-67ee-49bd-82c8-4cd4865e9ac5';
    const required = { name: 'Иван Иванов', phone: '+375291234567' };

    it.each<CreateClientDto>([
      { ...required },
      { ...required, email: null, notes: null },
      { ...required, email: 'ivan@example.com', notes: 'Позвонить за час.' },
    ])(
      'creates a client without equipment and returns details: %j',
      async (dto) => {
        const client = {
          id: clientId,
          ...required,
          email: dto.email ?? null,
          notes: dto.notes ?? null,
          equipment: [],
        };
        prisma.company.findUnique.mockResolvedValue({ id: companyId });
        prisma.client.create.mockResolvedValue({ id: clientId });
        prisma.client.findFirst.mockResolvedValue(client);

        const result = await clientsService.create(companyId, dto);

        expect(prisma.company.findUnique).toHaveBeenCalledWith({
          where: { id: companyId },
          select: { id: true },
        });
        expect(prisma.client.create).toHaveBeenCalledWith({
          data: {
            companyId,
            ...required,
            email: dto.email,
            notes: dto.notes,
          },
          select: { id: true },
        });
        expect(prisma.client.findFirst).toHaveBeenCalledWith(
          expect.objectContaining({ where: { id: clientId, companyId } }),
        );
        expect(result).toEqual(client);
      },
    );

    it('does not create a client when the company is missing', async () => {
      prisma.company.findUnique.mockResolvedValue(null);

      await expect(clientsService.create(companyId, required)).rejects.toThrow(
        new NotFoundException('Компания не найдена'),
      );
      expect(prisma.client.create).not.toHaveBeenCalled();
      expect(prisma.client.findFirst).not.toHaveBeenCalled();
    });

    it('returns a conflict for a duplicate phone without updating the existing client', async () => {
      prisma.company.findUnique.mockResolvedValue({ id: companyId });
      prisma.client.create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('Duplicate phone', {
          code: 'P2002',
          clientVersion: 'test',
        }),
      );

      await expect(clientsService.create(companyId, required)).rejects.toThrow(
        new ConflictException(
          'Клиент с таким телефоном уже существует в компании',
        ),
      );
      expect(prisma.client.update).not.toHaveBeenCalled();
      expect(prisma.client.findFirst).not.toHaveBeenCalled();
    });

    it.each([
      new Error('Connection lost'),
      new Prisma.PrismaClientKnownRequestError('Unexpected database error', {
        code: 'P2024',
        clientVersion: 'test',
      }),
    ])(
      'rethrows unexpected write errors without reading details: %j',
      async (error) => {
        prisma.company.findUnique.mockResolvedValue({ id: companyId });
        prisma.client.create.mockRejectedValue(error);

        await expect(clientsService.create(companyId, required)).rejects.toBe(
          error,
        );
        expect(prisma.client.findFirst).not.toHaveBeenCalled();
      },
    );
  });

  describe('update', () => {
    it('updates a client within the company and returns its details', async () => {
      const companyId = '7cfad2ad-8c32-4614-bd68-4882d7998655';
      const clientId = '8810c8d6-67ee-49bd-82c8-4cd4865e9ac5';

      const dto = {
        name: 'Иван Петров',
        phone: '+375291234567',
        email: 'ivan@example.com',
        notes: 'Перед визитом позвонить.',
      };

      const client = {
        id: clientId,
        ...dto,
        equipment: [],
      };

      prisma.client.update.mockResolvedValue({ id: clientId });
      prisma.client.findFirst.mockResolvedValue(client);

      const result = await clientsService.update(companyId, clientId, dto);

      expect(prisma.client.update).toHaveBeenCalledWith({
        where: {
          id: clientId,
          companyId,
        },
        data: dto,
        select: {
          id: true,
        },
      });

      expect(prisma.client.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            id: clientId,
            companyId,
          },
        }),
      );

      expect(result).toEqual(client);
    });

    it.each([
      {
        dto: { name: 'Новое имя' },
        data: {
          name: 'Новое имя',
          phone: undefined,
          email: undefined,
          notes: undefined,
        },
      },
      {
        dto: { email: null },
        data: {
          name: undefined,
          phone: undefined,
          email: null,
          notes: undefined,
        },
      },
      {
        dto: { notes: null },
        data: {
          name: undefined,
          phone: undefined,
          email: undefined,
          notes: null,
        },
      },
      {
        dto: { notes: 'Новое примечание' },
        data: {
          name: undefined,
          phone: undefined,
          email: undefined,
          notes: 'Новое примечание',
        },
      },
    ])(
      'preserves omitted fields and explicit null: %j',
      async ({ dto, data }) => {
        const companyId = '7cfad2ad-8c32-4614-bd68-4882d7998655';
        const clientId = '8810c8d6-67ee-49bd-82c8-4cd4865e9ac5';
        const notes = 'notes' in dto ? dto.notes : 'Существующее примечание';
        prisma.client.update.mockResolvedValue({ id: clientId });
        prisma.client.findFirst.mockResolvedValue({
          id: clientId,
          name: 'Новое имя',
          phone: '+375291234567',
          email: null,
          notes,
          equipment: [],
        });

        const result = await clientsService.update(companyId, clientId, dto);

        expect(result.notes).toBe(notes);
        expect(result.phone).toBe('+375291234567');

        expect(prisma.client.update).toHaveBeenCalledWith({
          where: { id: clientId, companyId },
          data,
          select: { id: true },
        });
      },
    );

    it.each([
      new Error('Connection lost'),
      new Prisma.PrismaClientKnownRequestError('Unexpected database error', {
        code: 'P2024',
        clientVersion: 'test',
      }),
    ])('rethrows unexpected errors without reading details', async (error) => {
      prisma.client.update.mockRejectedValue(error);
      await expect(
        clientsService.update('company-a', 'client-a', { name: 'Иван' }),
      ).rejects.toBe(error);
      expect(prisma.client.findFirst).not.toHaveBeenCalled();
    });

    it.each([
      { code: 'P2025', exception: NotFoundException },
      { code: 'P2002', exception: ConflictException },
    ])(
      'maps Prisma error $code to an HTTP exception',
      async ({ code, exception }) => {
        const companyId = '7cfad2ad-8c32-4614-bd68-4882d7998655';
        const clientId = '8810c8d6-67ee-49bd-82c8-4cd4865e9ac5';

        prisma.client.update.mockRejectedValue(
          new Prisma.PrismaClientKnownRequestError('Database error', {
            code,
            clientVersion: 'test',
          }),
        );

        await expect(
          clientsService.update(companyId, clientId, {
            phone: '+375291234567',
          }),
        ).rejects.toBeInstanceOf(exception);

        expect(prisma.client.findFirst).not.toHaveBeenCalled();
      },
    );
  });

  describe('findAll', () => {
    it('throws NotFoundException when company does not exist', async () => {
      const companyId = '00000000-0000-4000-8000-000000000000';

      prisma.company.findUnique.mockResolvedValue(null);

      await expect(
        clientsService.findAll(companyId, {
          page: 1,
          limit: 20,
        }),
      ).rejects.toBeInstanceOf(NotFoundException);

      expect(prisma.company.findUnique).toHaveBeenCalledWith({
        where: {
          id: companyId,
        },
        select: {
          id: true,
        },
      });

      expect(prisma.client.findMany).not.toHaveBeenCalled();
      expect(prisma.client.count).not.toHaveBeenCalled();
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('returns paginated clients with equipment', async () => {
      const companyId = '7cfad2ad-8c32-4614-bd68-4882d7998655';

      const clients = [
        {
          id: '8810c8d6-67ee-49bd-82c8-4cd4865e9ac5',
          name: 'Иван Иванов',
          phone: '+375291234567',
          email: 'ivan@example.com',
          notes: 'Перед визитом позвонить.',
          equipment: [
            {
              id: '960ae682-3486-4fd5-8709-76b650582f84',
              name: 'Газовый котёл BAXI',
              installationDate: new Date('2024-02-07T00:00:00.000Z'),
              lastServiceDate: null,
              nextServiceDate: new Date('2027-02-07T00:00:00.000Z'),
            },
          ],
        },
      ];

      prisma.company.findUnique.mockResolvedValue({
        id: companyId,
      });
      prisma.client.findMany.mockResolvedValue(clients);
      prisma.client.count.mockResolvedValue(5);
      prisma.$transaction.mockResolvedValue([clients, 5]);

      const result = await clientsService.findAll(companyId, {
        page: 2,
        limit: 2,
      });

      expect(prisma.client.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            companyId,
          },
          skip: 2,
          take: 2,
        }),
      );

      expect(prisma.client.count).toHaveBeenCalledWith({
        where: {
          companyId,
        },
      });

      expect(result).toEqual({
        items: [
          {
            id: '8810c8d6-67ee-49bd-82c8-4cd4865e9ac5',
            name: 'Иван Иванов',
            phone: '+375291234567',
            email: 'ivan@example.com',
            notes: 'Перед визитом позвонить.',
            equipment: [
              {
                id: '960ae682-3486-4fd5-8709-76b650582f84',
                name: 'Газовый котёл BAXI',
                installationDate: '2024-02-07',
                lastServiceDate: null,
                nextServiceDate: '2027-02-07',
                status: EquipmentServiceStatus.OK,
              },
            ],
          },
        ],
        total: 5,
        page: 2,
        limit: 2,
      });
    });

    it('applies one search value to client name and phone', async () => {
      const companyId = '7cfad2ad-8c32-4614-bd68-4882d7998655';

      prisma.company.findUnique.mockResolvedValue({
        id: companyId,
      });
      prisma.client.findMany.mockResolvedValue([]);
      prisma.client.count.mockResolvedValue(0);
      prisma.$transaction.mockResolvedValue([[], 0]);

      await clientsService.findAll(companyId, {
        page: 1,
        limit: 20,
        search: '  37529123  ',
      });

      const where = {
        companyId,
        OR: [
          {
            name: {
              contains: '37529123',
              mode: 'insensitive',
            },
          },
          {
            phone: {
              contains: '37529123',
            },
          },
        ],
      };

      expect(prisma.client.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where,
        }),
      );

      expect(prisma.client.count).toHaveBeenCalledWith({
        where,
      });
    });

    it('filters clients and their equipment by DUE_SOON status', async () => {
      const companyId = '7cfad2ad-8c32-4614-bd68-4882d7998655';

      prisma.company.findUnique.mockResolvedValue({
        id: companyId,
      });
      prisma.client.findMany.mockResolvedValue([]);
      prisma.client.count.mockResolvedValue(0);
      prisma.$transaction.mockResolvedValue([[], 0]);

      await clientsService.findAll(companyId, {
        page: 1,
        limit: 20,
        status: EquipmentServiceStatus.DUE_SOON,
      });

      const equipmentWhere = {
        companyId,
        nextServiceDate: {
          gte: new Date('2026-09-02T00:00:00.000Z'),
          lte: new Date('2026-10-02T00:00:00.000Z'),
        },
      };

      const clientWhere = {
        companyId,
        equipment: {
          some: equipmentWhere,
        },
      };

      expect(prisma.client.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: clientWhere,
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            notes: true,
            equipment: {
              where: equipmentWhere,
              select: {
                id: true,
                name: true,
                installationDate: true,
                lastServiceDate: true,
                nextServiceDate: true,
              },
              orderBy: [{ name: 'asc' }, { id: 'asc' }],
            },
          },
        }),
      );

      expect(prisma.client.count).toHaveBeenCalledWith({
        where: clientWhere,
      });
    });

    it('combines search and status filters', async () => {
      const companyId = '7cfad2ad-8c32-4614-bd68-4882d7998655';

      prisma.company.findUnique.mockResolvedValue({
        id: companyId,
      });
      prisma.client.findMany.mockResolvedValue([]);
      prisma.client.count.mockResolvedValue(0);
      prisma.$transaction.mockResolvedValue([[], 0]);

      await clientsService.findAll(companyId, {
        page: 1,
        limit: 20,
        search: '  Иван  ',
        status: EquipmentServiceStatus.UNSCHEDULED,
      });

      const equipmentWhere = {
        companyId,
        nextServiceDate: null,
      };

      const where = {
        companyId,
        OR: [
          {
            name: {
              contains: 'Иван',
              mode: 'insensitive',
            },
          },
          {
            phone: {
              contains: 'Иван',
            },
          },
        ],
        equipment: {
          some: equipmentWhere,
        },
      };

      expect(prisma.client.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where,
        }),
      );

      expect(prisma.client.count).toHaveBeenCalledWith({
        where,
      });
    });
  });

  describe('findOne', () => {
    it('returns one client with equipment from the requested company', async () => {
      const companyId = '7cfad2ad-8c32-4614-bd68-4882d7998655';
      const clientId = '8810c8d6-67ee-49bd-82c8-4cd4865e9ac5';

      prisma.client.findFirst.mockResolvedValue({
        id: clientId,
        name: 'Иван Иванов',
        phone: '+375291234567',
        email: 'ivan@example.com',
        notes: 'Перед визитом позвонить.',
        equipment: [
          {
            id: '960ae682-3486-4fd5-8709-76b650582f84',
            name: 'Газовый котёл BAXI',
            installationDate: new Date('2024-02-07T00:00:00.000Z'),
            lastServiceDate: null,
            nextServiceDate: new Date('2027-02-07T00:00:00.000Z'),
          },
        ],
      });

      const result = await clientsService.findOne(companyId, clientId);

      expect(prisma.client.findFirst).toHaveBeenCalledWith({
        where: {
          id: clientId,
          companyId,
        },
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
          notes: true,
          equipment: {
            select: {
              id: true,
              name: true,
              installationDate: true,
              lastServiceDate: true,
              nextServiceDate: true,
            },
            orderBy: [{ name: 'asc' }, { id: 'asc' }],
          },
        },
      });

      expect(result).toEqual({
        id: clientId,
        name: 'Иван Иванов',
        phone: '+375291234567',
        email: 'ivan@example.com',
        notes: 'Перед визитом позвонить.',
        equipment: [
          {
            id: '960ae682-3486-4fd5-8709-76b650582f84',
            name: 'Газовый котёл BAXI',
            installationDate: '2024-02-07',
            lastServiceDate: null,
            nextServiceDate: '2027-02-07',
            status: EquipmentServiceStatus.OK,
          },
        ],
      });
    });

    it('throws NotFoundException when client does not belong to the company', async () => {
      const companyId = '7cfad2ad-8c32-4614-bd68-4882d7998655';
      const clientId = '8810c8d6-67ee-49bd-82c8-4cd4865e9ac5';

      prisma.client.findFirst.mockResolvedValue(null);

      await expect(clientsService.findOne(companyId, clientId)).rejects.toThrow(
        'Клиент не найден',
      );

      expect(prisma.client.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            id: clientId,
            companyId,
          },
        }),
      );
    });
  });
});
