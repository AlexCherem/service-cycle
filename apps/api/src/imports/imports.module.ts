import { Module } from '@nestjs/common';

import { PrismaModule } from '../database/prisma/prisma.module';
import { ImportsController } from './imports.controller';
import { ImportsService } from './imports.service';
import { ClientImportParser } from './parsers/client-import.parser';
import { ClientImportWriter } from './writers/client-import.writer';

@Module({
  imports: [PrismaModule],
  controllers: [ImportsController],
  providers: [ImportsService, ClientImportParser, ClientImportWriter],
})
export class ImportsModule {}
