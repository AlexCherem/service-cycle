import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../database/prisma/prisma.service';
import { ImportsService } from './imports.service';
import { createFileHash } from './utils/file-hash';
import { ClientImportWriter } from './writers/client-import.writer';

type PrismaMock = {
  equipment: { findMany: jest.Mock };
  company: {
    findUnique: jest.Mock;
  };
};

type ClientImportParserMock = {
  parse: jest.Mock;
};

type ClientImportWriterMock = {
  write: jest.Mock;
};

describe('ImportsService', () => {
  let importsService: ImportsService;
  let prisma: PrismaMock;
  let clientImportParser: ClientImportParserMock;
  let clientImportWriter: ClientImportWriterMock;

  beforeEach(() => {
    prisma = {
      equipment: { findMany: jest.fn().mockResolvedValue([]) },
      company: {
        findUnique: jest.fn(),
      },
    };

    clientImportParser = {
      parse: jest.fn(),
    };

    clientImportWriter = {
      write: jest.fn(),
    };

    importsService = new ImportsService(
      prisma as unknown as PrismaService,
      clientImportParser,
      clientImportWriter as unknown as ClientImportWriter,
    );
  });

  describe('createTemplate', () => {
    it('throws NotFoundException when company does not exist', async () => {
      const companyId = '7cfad2ad-8c32-4614-bd68-4882d7998655';

      prisma.company.findUnique.mockResolvedValue(null);

      await expect(
        importsService.createTemplate(companyId),
      ).rejects.toBeInstanceOf(NotFoundException);

      expect(prisma.company.findUnique).toHaveBeenCalledWith({
        where: {
          id: companyId,
        },
        select: {
          id: true,
        },
      });

      expect(clientImportParser.parse).not.toHaveBeenCalled();
      expect(clientImportWriter.write).not.toHaveBeenCalled();
    });

    it('returns Excel template when company exists', async () => {
      const companyId = '7cfad2ad-8c32-4614-bd68-4882d7998655';

      prisma.company.findUnique.mockResolvedValue({
        id: companyId,
      });

      const result = await importsService.createTemplate(companyId);

      expect(Buffer.isBuffer(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);

      expect(prisma.company.findUnique).toHaveBeenCalledWith({
        where: {
          id: companyId,
        },
        select: {
          id: true,
        },
      });

      expect(clientImportParser.parse).not.toHaveBeenCalled();
      expect(clientImportWriter.write).not.toHaveBeenCalled();
    });
  });

  describe('preview', () => {
    it('throws NotFoundException when company does not exist', async () => {
      const companyId = '7cfad2ad-8c32-4614-bd68-4882d7998655';
      const fileBuffer = Buffer.from('excel file');

      prisma.company.findUnique.mockResolvedValue(null);

      await expect(
        importsService.preview(companyId, fileBuffer),
      ).rejects.toBeInstanceOf(NotFoundException);

      expect(prisma.company.findUnique).toHaveBeenCalledWith({
        where: {
          id: companyId,
        },
        select: {
          id: true,
        },
      });

      expect(clientImportParser.parse).not.toHaveBeenCalled();
    });

    it('returns file hash and parsed preview when company exists', async () => {
      const companyId = '7cfad2ad-8c32-4614-bd68-4882d7998655';
      const fileBuffer = Buffer.from('excel file');

      const parsedPreview = {
        worksheetName: 'Клиенты',
        rowCount: 1,
        columnCount: 3,
        headers: ['ФИО', 'Телефон', 'Оборудование'],
        detectedColumns: {
          name: 'ФИО',
          phone: 'Телефон',
          email: null,
          equipment: 'Оборудование',
          installationDate: null,
          lastServiceDate: null,
          nextServiceDate: null,
        },
        validRowCount: 0,
        invalidRowCount: 0,
        rows: [],
      };

      prisma.company.findUnique.mockResolvedValue({
        id: companyId,
      });

      clientImportParser.parse.mockResolvedValue(parsedPreview);

      const result = await importsService.preview(companyId, fileBuffer);

      expect(clientImportParser.parse).toHaveBeenCalledWith(fileBuffer);

      expect(result).toEqual({
        fileHash: createFileHash(fileBuffer),
        ...parsedPreview,
      });

      expect(clientImportWriter.write).not.toHaveBeenCalled();
    });
  });

  describe('equipment matching preview', () => {
    const row = (serialNumber: string | null, phone = '+375291234567') => ({
      rowNumber: 2,
      isValid: true,
      errors: [],
      warnings: [],
      data: { name: 'Иван', phone, serialNumber, equipment: 'Кондиционер' },
    });

    it('marks missing numbers and duplicate identities invalid and preserves valid rows', async () => {
      prisma.company.findUnique.mockResolvedValue({ id: 'company-a' });
      clientImportParser.parse.mockResolvedValue({
        rows: [row(null), row('001'), row('001'), row('002')],
      });
      const result = await importsService.preview(
        'company-a',
        Buffer.from('file'),
      );
      expect(result.validRowCount).toBe(1);
      expect(result.invalidRowCount).toBe(3);
      expect(result.rows.map((item) => item.isValid)).toEqual([
        false,
        false,
        false,
        true,
      ]);
      expect(result.rows[0].errors.join()).toContain('укажите серийный номер');
      expect(result.rows[1].errors.join()).toContain('повторяется');
    });

    it('marks ambiguous existing equipment invalid and scopes lookup to company and client', async () => {
      prisma.company.findUnique.mockResolvedValue({ id: 'company-a' });
      clientImportParser.parse.mockResolvedValue({
        rows: [row('001'), row('002')],
      });
      prisma.equipment.findMany.mockResolvedValue([
        { serialNumber: '001', client: { phone: '+375291234567' } },
        { serialNumber: '001', client: { phone: '+375291234567' } },
      ]);
      const result = await importsService.preview(
        'company-a',
        Buffer.from('file'),
      );
      expect(result.validRowCount).toBe(1);
      expect(result.rows[0].errors.join()).toContain('несколько устройств');
      expect(prisma.equipment.findMany).toHaveBeenCalledWith({
        where: {
          companyId: 'company-a',
          client: { companyId: 'company-a' },
          OR: [
            { serialNumber: '001', client: { phone: '+375291234567' } },
            { serialNumber: '002', client: { phone: '+375291234567' } },
          ],
        },
        select: {
          serialNumber: true,
          installationDate: true,
          lastServiceDate: true,
          nextServiceDate: true,
          client: { select: { phone: true } },
        },
      });
    });

    it('validates imported dates against dates retained from the database', async () => {
      prisma.company.findUnique.mockResolvedValue({ id: 'company-a' });
      const imported = row('001');
      clientImportParser.parse.mockResolvedValue({
        rows: [
          {
            ...imported,
            data: { ...imported.data, installationDate: '2026-01-01' },
          },
        ],
      });
      prisma.equipment.findMany.mockResolvedValue([
        {
          serialNumber: '001',
          client: { phone: '+375291234567' },
          installationDate: new Date('2024-01-01'),
          lastServiceDate: new Date('2025-01-01'),
          nextServiceDate: null,
        },
      ]);
      const result = await importsService.preview(
        'company-a',
        Buffer.from('file'),
      );
      expect(result.validRowCount).toBe(0);
      expect(result.rows[0].errors).toContain(
        'Дата последнего обслуживания не может быть раньше даты установки',
      );
    });

    it('allows the same serial for different clients and trims edge spaces', async () => {
      prisma.company.findUnique.mockResolvedValue({ id: 'company-a' });
      clientImportParser.parse.mockResolvedValue({
        rows: [row(' 001 '), row('001', '+375299876543')],
      });
      const result = await importsService.preview(
        'company-a',
        Buffer.from('file'),
      );
      expect(result.validRowCount).toBe(2);
      expect(result.rows[0].data.serialNumber).toBe('001');
    });

    it('rechecks database ambiguity on confirmation and skips affected rows', async () => {
      prisma.company.findUnique.mockResolvedValue({ id: 'company-a' });
      clientImportParser.parse.mockResolvedValue({
        rows: [row('001'), row('002')],
      });
      const file = Buffer.from('file');
      const preview = await importsService.preview('company-a', file);
      expect(preview.validRowCount).toBe(2);
      prisma.equipment.findMany.mockResolvedValue([
        { serialNumber: '001', client: { phone: '+375291234567' } },
        { serialNumber: '001', client: { phone: '+375291234567' } },
      ]);
      clientImportWriter.write.mockResolvedValue({
        createdClientCount: 0,
        updatedClientCount: 1,
        createdEquipmentCount: 1,
        updatedEquipmentCount: 0,
      });
      const result = await importsService.importClients(
        'company-a',
        file,
        preview.fileHash,
      );
      expect(result.importedRowCount).toBe(1);
      expect(result.skippedRowCount).toBe(1);
      expect(clientImportWriter.write).toHaveBeenCalledWith('company-a', [
        row('002'),
      ]);
    });
  });

  describe('importClients', () => {
    it('throws ConflictException when file does not match preview hash', async () => {
      const companyId = '7cfad2ad-8c32-4614-bd68-4882d7998655';
      const fileBuffer = Buffer.from('changed excel file');
      const previewHash = createFileHash(Buffer.from('original excel file'));

      prisma.company.findUnique.mockResolvedValue({
        id: companyId,
      });

      await expect(
        importsService.importClients(companyId, fileBuffer, previewHash),
      ).rejects.toBeInstanceOf(ConflictException);

      expect(clientImportParser.parse).not.toHaveBeenCalled();
      expect(clientImportWriter.write).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when file has no valid rows', async () => {
      const companyId = '7cfad2ad-8c32-4614-bd68-4882d7998655';
      const fileBuffer = Buffer.from('excel file');
      const previewHash = createFileHash(fileBuffer);

      const parsedPreview = {
        invalidRowCount: 1,
        rows: [
          {
            isValid: false,
            errors: ['Ошибка'],
            data: { phone: '', serialNumber: null },
          },
        ],
      };

      prisma.company.findUnique.mockResolvedValue({
        id: companyId,
      });

      clientImportParser.parse.mockResolvedValue(parsedPreview);

      await expect(
        importsService.importClients(companyId, fileBuffer, previewHash),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(clientImportParser.parse).toHaveBeenCalledWith(fileBuffer);
      expect(clientImportWriter.write).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when company does not exist', async () => {
      const companyId = '7cfad2ad-8c32-4614-bd68-4882d7998655';
      const fileBuffer = Buffer.from('excel file');
      const previewHash = createFileHash(fileBuffer);

      prisma.company.findUnique.mockResolvedValue(null);

      await expect(
        importsService.importClients(companyId, fileBuffer, previewHash),
      ).rejects.toBeInstanceOf(NotFoundException);

      expect(clientImportParser.parse).not.toHaveBeenCalled();
      expect(clientImportWriter.write).not.toHaveBeenCalled();
    });

    it('writes only valid rows and returns import result', async () => {
      const companyId = '7cfad2ad-8c32-4614-bd68-4882d7998655';
      const fileBuffer = Buffer.from('excel file');
      const previewHash = createFileHash(fileBuffer);

      const validRow = {
        isValid: true,
        errors: [],
        data: { phone: '+375291234567', serialNumber: '001' },
      };

      const invalidRow = {
        isValid: false,
        errors: ['Ошибка'],
        data: { phone: '', serialNumber: null },
      };

      const parsedPreview = {
        invalidRowCount: 1,
        rows: [validRow, invalidRow],
      };

      const writeResult = {
        createdClientCount: 1,
        updatedClientCount: 0,
        createdEquipmentCount: 1,
        updatedEquipmentCount: 0,
      };

      prisma.company.findUnique.mockResolvedValue({
        id: companyId,
      });

      clientImportParser.parse.mockResolvedValue(parsedPreview);
      clientImportWriter.write.mockResolvedValue(writeResult);

      const result = await importsService.importClients(
        companyId,
        fileBuffer,
        previewHash,
      );

      expect(clientImportParser.parse).toHaveBeenCalledWith(fileBuffer);

      expect(clientImportWriter.write).toHaveBeenCalledWith(companyId, [
        validRow,
      ]);

      expect(result).toEqual({
        fileHash: previewHash,
        importedRowCount: 1,
        skippedRowCount: 1,
        ...writeResult,
      });
    });
  });
});
