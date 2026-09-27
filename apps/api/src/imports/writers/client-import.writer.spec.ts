import { ConflictException } from '@nestjs/common';

import { PrismaService } from '../../database/prisma/prisma.service';
import { Prisma } from '../../generated/prisma/client';
import type { ClientImportRow } from '../parsers/client-import.parser';
import { ClientImportWriter } from './client-import.writer';

const createRow = (
  serialNumber: string | null,
  data: Partial<ClientImportRow['data']> = {},
): ClientImportRow => ({
  rowNumber: 2,
  data: {
    name: 'Иван',
    phone: '+375291234567',
    email: null,
    equipment: 'Кондиционер',
    serialNumber,
    type: null,
    manufacturer: null,
    model: null,
    notes: null,
    serviceIntervalMonths: null,
    installationDate: null,
    lastServiceDate: null,
    nextServiceDate: null,
    ...data,
  },
  isValid: true,
  errors: [],
  warnings: [],
});

const companyId = 'company-a';
const clientId = 'client-a';

describe('ClientImportWriter', () => {
  const transaction = {
    client: { findMany: jest.fn(), upsert: jest.fn() },
    equipment: { findMany: jest.fn(), create: jest.fn(), update: jest.fn() },
  };
  const prisma = { $transaction: jest.fn() };
  let writer: ClientImportWriter;

  beforeEach(() => {
    jest.resetAllMocks();
    transaction.client.findMany.mockResolvedValue([]);
    transaction.client.upsert.mockResolvedValue({ id: clientId });
    transaction.equipment.findMany.mockResolvedValue([]);
    prisma.$transaction.mockImplementation(
      (callback: (tx: typeof transaction) => Promise<unknown>) =>
        callback(transaction),
    );
    writer = new ClientImportWriter(prisma as unknown as PrismaService);
  });

  it('creates distinct equipment with the same name and different serial numbers', async () => {
    const result = await writer.write(companyId, [
      createRow('001'),
      createRow('002'),
    ]);
    expect(transaction.client.upsert).toHaveBeenCalledTimes(1);
    expect(transaction.equipment.create).toHaveBeenCalledTimes(2);
    expect(transaction.equipment.create).toHaveBeenNthCalledWith(1, {
      data: {
        companyId,
        clientId,
        name: 'Кондиционер',
        serialNumber: '001',
        installationDate: null,
        lastServiceDate: null,
        nextServiceDate: null,
      },
    });
    expect(transaction.equipment.create).toHaveBeenNthCalledWith(2, {
      data: {
        companyId,
        clientId,
        name: 'Кондиционер',
        serialNumber: '002',
        installationDate: null,
        lastServiceDate: null,
        nextServiceDate: null,
      },
    });
    expect(result).toEqual({
      createdClientCount: 1,
      updatedClientCount: 0,
      createdEquipmentCount: 2,
      updatedEquipmentCount: 0,
    });
    expect(prisma.$transaction).toHaveBeenCalledWith(expect.any(Function), {
      isolationLevel: 'Serializable',
    });
  });

  it('updates a matching serial and adds new equipment and clients', async () => {
    transaction.client.findMany.mockResolvedValue([{ phone: '+375291234567' }]);
    transaction.client.upsert
      .mockResolvedValueOnce({ id: clientId })
      .mockResolvedValueOnce({ id: 'new-client' });
    transaction.equipment.findMany
      .mockResolvedValueOnce([
        { serialNumber: '001', client: { phone: '+375291234567' } },
      ])
      .mockResolvedValueOnce([{ id: 'equipment-a' }])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
    const result = await writer.write(companyId, [
      createRow('001', {
        equipment: 'Новое название',
        notes: 'Обновлено',
        nextServiceDate: '2027-09-15',
      }),
      createRow('002'),
      createRow('001', { phone: '+375299876543', name: 'Новый клиент' }),
    ]);
    expect(transaction.equipment.findMany).toHaveBeenNthCalledWith(2, {
      where: {
        companyId,
        clientId,
        client: { companyId },
        serialNumber: '001',
      },
      select: { id: true },
      take: 2,
    });
    expect(transaction.equipment.update).toHaveBeenCalledWith({
      where: { id: 'equipment-a', companyId, clientId, client: { companyId } },
      data: {
        name: 'Новое название',
        serialNumber: '001',
        notes: 'Обновлено',
        nextServiceDate: new Date('2027-09-15T00:00:00.000Z'),
      },
    });
    expect(result).toEqual({
      createdClientCount: 1,
      updatedClientCount: 1,
      createdEquipmentCount: 2,
      updatedEquipmentCount: 1,
    });
  });

  it('rejects repeated identities in a file instead of merging rows', async () => {
    await expect(
      writer.write(companyId, [createRow('001'), createRow('001')]),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(transaction.client.upsert).not.toHaveBeenCalled();
    expect(transaction.equipment.create).not.toHaveBeenCalled();
  });

  it('rejects missing serial numbers before writing clients', async () => {
    await expect(
      writer.write(companyId, [createRow(null)]),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(transaction.client.upsert).not.toHaveBeenCalled();
  });

  it('rechecks ambiguous database matches inside the transaction', async () => {
    transaction.equipment.findMany.mockResolvedValue([
      { serialNumber: '001', client: { phone: '+375291234567' } },
      { serialNumber: '001', client: { phone: '+375291234567' } },
    ]);
    await expect(
      writer.write(companyId, [createRow('001')]),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(transaction.client.upsert).not.toHaveBeenCalled();
  });

  it('rejects dates incompatible with retained data inside the transaction', async () => {
    transaction.equipment.findMany.mockResolvedValue([
      {
        serialNumber: '001',
        client: { phone: '+375291234567' },
        installationDate: new Date('2024-01-01'),
        lastServiceDate: new Date('2025-01-01'),
        nextServiceDate: null,
      },
    ]);
    await expect(
      writer.write(companyId, [
        createRow('001', { installationDate: '2026-01-01' }),
      ]),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(transaction.client.upsert).not.toHaveBeenCalled();
    expect(transaction.equipment.update).not.toHaveBeenCalled();
  });

  it('retries serialization conflicts so parallel imports do not create duplicates', async () => {
    prisma.$transaction.mockRejectedValueOnce(
      new Prisma.PrismaClientKnownRequestError('conflict', {
        code: 'P2034',
        clientVersion: 'test',
      }),
    );
    await writer.write(companyId, [createRow('001')]);
    expect(prisma.$transaction).toHaveBeenCalledTimes(2);
  });

  it('returns a conflict after bounded serialization retries', async () => {
    prisma.$transaction.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('conflict', {
        code: 'P2034',
        clientVersion: 'test',
      }),
    );
    await expect(
      writer.write(companyId, [createRow('001')]),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(prisma.$transaction).toHaveBeenCalledTimes(3);
  });
});
