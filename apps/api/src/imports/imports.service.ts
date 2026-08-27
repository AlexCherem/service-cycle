import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../database/prisma/prisma.service';
import { ClientImportParser } from './parsers/client-import.parser';
import { createFileHash } from './utils/file-hash';
import { ClientImportWriter } from './writers/client-import.writer';

@Injectable()
export class ImportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly clientImportParser: ClientImportParser,
    private readonly clientImportWriter: ClientImportWriter,
  ) {}

  async preview(companyId: string, fileBuffer: Buffer) {
    await this.ensureCompanyExists(companyId);

    const fileHash = createFileHash(fileBuffer);
    const preview = await this.clientImportParser.parse(fileBuffer);

    return {
      fileHash,
      ...preview,
    };
  }

  async importClients(
    companyId: string,
    fileBuffer: Buffer,
    previewHash: string,
  ) {
    await this.ensureCompanyExists(companyId);

    const fileHash = this.ensureFileMatchesPreview(fileBuffer, previewHash);

    const preview = await this.clientImportParser.parse(fileBuffer);
    const validRows = preview.rows.filter((row) => row.isValid);

    if (validRows.length === 0) {
      throw new BadRequestException('В файле нет корректных строк для импорта');
    }

    const writeResult = await this.clientImportWriter.write(
      companyId,
      validRows,
    );

    return {
      fileHash,
      importedRowCount: validRows.length,
      skippedRowCount: preview.invalidRowCount,
      ...writeResult,
    };
  }

  private ensureFileMatchesPreview(
    fileBuffer: Buffer,
    previewHash: string,
  ): string {
    const fileHash = createFileHash(fileBuffer);

    if (fileHash !== previewHash) {
      throw new ConflictException(
        'Файл отличается от проверенного. Выполните предпросмотр ещё раз',
      );
    }

    return fileHash;
  }

  private async ensureCompanyExists(companyId: string): Promise<void> {
    const company = await this.prisma.company.findUnique({
      where: {
        id: companyId,
      },
      select: {
        id: true,
      },
    });

    if (!company) {
      throw new NotFoundException('Компания не найдена');
    }
  }
}
