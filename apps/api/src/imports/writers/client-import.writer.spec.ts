import { PrismaService } from '../../database/prisma/prisma.service';
import type { ClientImportRow } from '../parsers/client-import.parser';
import { ClientImportWriter } from './client-import.writer';

type TransactionMock = {
  client: {
    findMany: jest.Mock;
    upsert: jest.Mock;
  };
  equipment: {
    findMany: jest.Mock;
    upsert: jest.Mock;
  };
};

type PrismaMock = {
  $transaction: jest.Mock;
};

const createRow = (
  rowNumber: number,
  data: Partial<ClientImportRow['data']> = {},
): ClientImportRow => ({
  rowNumber,
  data: {
    name: 'Иван Иванов',
    phone: '+375291234567',
    email: 'ivan@example.com',
    equipment: 'Газовый котёл',
    installationDate: '2024-02-01',
    lastServiceDate: '2025-02-01',
    nextServiceDate: '2026-02-01',
    ...data,
  },
  isValid: true,
  errors: [],
  warnings: [],
});

describe('ClientImportWriter', () => {
  let writer: ClientImportWriter;
  let prisma: PrismaMock;
  let transaction: TransactionMock;

  beforeEach(() => {
    transaction = {
      client: {
        findMany: jest.fn(),
        upsert: jest.fn(),
      },
      equipment: {
        findMany: jest.fn(),
        upsert: jest.fn(),
      },
    };

    prisma = {
      $transaction: jest.fn(),
    };

    prisma.$transaction.mockImplementation(
      (callback: (transaction: TransactionMock) => Promise<unknown>) =>
        callback(transaction),
    );

    writer = new ClientImportWriter(prisma as unknown as PrismaService);
  });

  it('upserts clients and equipment and returns created and updated counts', async () => {
    const companyId = '7cfad2ad-8c32-4614-bd68-4882d7998655';
    const existingClientId = '8810c8d6-67ee-49bd-82c8-4cd4865e9ac5';
    const newClientId = 'f09be5ae-b40c-4ad4-af3d-f43450a0ca78';

    const rows = [
      createRow(2, {
        name: 'Существующий клиент',
        email: null,
        installationDate: null,
        lastServiceDate: null,
        nextServiceDate: null,
      }),
      createRow(3, {
        name: 'Новый клиент',
        phone: '+375299876543',
        email: 'new@example.com',
        equipment: 'Кондиционер',
        installationDate: '2024-03-10',
        lastServiceDate: '2025-03-10',
        nextServiceDate: '2026-03-10',
      }),
    ];

    transaction.client.findMany.mockResolvedValue([
      {
        phone: '+375291234567',
      },
    ]);
    transaction.client.upsert
      .mockResolvedValueOnce({ id: existingClientId })
      .mockResolvedValueOnce({ id: newClientId });
    transaction.equipment.findMany.mockResolvedValue([
      {
        clientId: existingClientId,
        name: 'Газовый котёл',
      },
    ]);
    transaction.equipment.upsert.mockResolvedValue({});

    const result = await writer.write(companyId, rows);

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(transaction.client.findMany).toHaveBeenCalledWith({
      where: {
        companyId,
        phone: {
          in: ['+375291234567', '+375299876543'],
        },
      },
      select: {
        phone: true,
      },
    });

    expect(transaction.client.upsert).toHaveBeenNthCalledWith(1, {
      where: {
        companyId_phone: {
          companyId,
          phone: '+375291234567',
        },
      },
      update: {
        name: 'Существующий клиент',
      },
      create: {
        companyId,
        name: 'Существующий клиент',
        phone: '+375291234567',
        email: null,
      },
    });
    expect(transaction.client.upsert).toHaveBeenNthCalledWith(2, {
      where: {
        companyId_phone: {
          companyId,
          phone: '+375299876543',
        },
      },
      update: {
        name: 'Новый клиент',
        email: 'new@example.com',
      },
      create: {
        companyId,
        name: 'Новый клиент',
        phone: '+375299876543',
        email: 'new@example.com',
      },
    });

    expect(transaction.equipment.findMany).toHaveBeenCalledWith({
      where: {
        OR: [
          {
            clientId: existingClientId,
            name: 'Газовый котёл',
          },
          {
            clientId: newClientId,
            name: 'Кондиционер',
          },
        ],
      },
      select: {
        clientId: true,
        name: true,
      },
    });

    expect(transaction.equipment.upsert).toHaveBeenNthCalledWith(1, {
      where: {
        clientId_name: {
          clientId: existingClientId,
          name: 'Газовый котёл',
        },
      },
      update: {},
      create: {
        companyId,
        clientId: existingClientId,
        name: 'Газовый котёл',
        installationDate: null,
        lastServiceDate: null,
        nextServiceDate: null,
      },
    });
    expect(transaction.equipment.upsert).toHaveBeenNthCalledWith(2, {
      where: {
        clientId_name: {
          clientId: newClientId,
          name: 'Кондиционер',
        },
      },
      update: {
        installationDate: new Date('2024-03-10T00:00:00.000Z'),
        lastServiceDate: new Date('2025-03-10T00:00:00.000Z'),
        nextServiceDate: new Date('2026-03-10T00:00:00.000Z'),
      },
      create: {
        companyId,
        clientId: newClientId,
        name: 'Кондиционер',
        installationDate: new Date('2024-03-10T00:00:00.000Z'),
        lastServiceDate: new Date('2025-03-10T00:00:00.000Z'),
        nextServiceDate: new Date('2026-03-10T00:00:00.000Z'),
      },
    });

    expect(result).toEqual({
      createdClientCount: 1,
      updatedClientCount: 1,
      createdEquipmentCount: 1,
      updatedEquipmentCount: 1,
    });
  });

  it('merges duplicate rows before writing them', async () => {
    const companyId = '7cfad2ad-8c32-4614-bd68-4882d7998655';
    const clientId = '8810c8d6-67ee-49bd-82c8-4cd4865e9ac5';

    const rows = [
      createRow(2, {
        installationDate: '2024-02-01',
        lastServiceDate: null,
        nextServiceDate: null,
      }),
      createRow(3, {
        name: 'Иван Иванов обновлённый',
        email: null,
        installationDate: null,
        lastServiceDate: '2025-02-01',
        nextServiceDate: '2026-02-01',
      }),
    ];

    transaction.client.findMany.mockResolvedValue([]);
    transaction.client.upsert.mockResolvedValue({ id: clientId });
    transaction.equipment.findMany.mockResolvedValue([]);
    transaction.equipment.upsert.mockResolvedValue({});

    const result = await writer.write(companyId, rows);

    expect(transaction.client.upsert).toHaveBeenCalledTimes(1);
    expect(transaction.client.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: {
          name: 'Иван Иванов обновлённый',
          email: 'ivan@example.com',
        },
      }),
    );

    expect(transaction.equipment.upsert).toHaveBeenCalledTimes(1);
    expect(transaction.equipment.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: {
          installationDate: new Date('2024-02-01T00:00:00.000Z'),
          lastServiceDate: new Date('2025-02-01T00:00:00.000Z'),
          nextServiceDate: new Date('2026-02-01T00:00:00.000Z'),
        },
      }),
    );

    expect(result).toEqual({
      createdClientCount: 1,
      updatedClientCount: 0,
      createdEquipmentCount: 1,
      updatedEquipmentCount: 0,
    });
  });
});
