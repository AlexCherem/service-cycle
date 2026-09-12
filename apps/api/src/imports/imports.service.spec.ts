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
      };

      const invalidRow = {
        isValid: false,
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
