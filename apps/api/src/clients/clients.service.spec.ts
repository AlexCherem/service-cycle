import { NotFoundException } from '@nestjs/common';

import { PrismaService } from '../database/prisma/prisma.service';
import { ClientsService } from './clients.service';

type PrismaMock = {
  company: {
    findUnique: jest.Mock;
  };
  client: {
    findFirst: jest.Mock;
    findMany: jest.Mock;
    count: jest.Mock;
  };
  $transaction: jest.Mock;
};

describe('ClientsService', () => {
  let clientsService: ClientsService;
  let prisma: PrismaMock;

  beforeEach(() => {
    prisma = {
      company: {
        findUnique: jest.fn(),
      },
      client: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    clientsService = new ClientsService(prisma as unknown as PrismaService);
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
            equipment: [
              {
                id: '960ae682-3486-4fd5-8709-76b650582f84',
                name: 'Газовый котёл BAXI',
                installationDate: '2024-02-07',
                lastServiceDate: null,
                nextServiceDate: '2027-02-07',
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
        equipment: [
          {
            id: '960ae682-3486-4fd5-8709-76b650582f84',
            name: 'Газовый котёл BAXI',
            installationDate: '2024-02-07',
            lastServiceDate: null,
            nextServiceDate: '2027-02-07',
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
