import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  ParseFilePipeBuilder,
  ParseUUIDPipe,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConflictResponse,
  ApiConsumes,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { ImportClientsDto } from './dto/import-clients.dto';
import { ImportErrorDto } from './dto/import-error.dto';
import { ImportPreviewDto } from './dto/import-preview.dto';
import { ImportResultDto } from './dto/import-result.dto';
import { ImportsService } from './imports.service';

const MAX_EXCEL_FILE_SIZE = 10 * 1024 * 1024;
const XLSX_MIME_TYPE =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

@ApiTags('client imports')
@Controller('companies/:companyId/client-imports')
export class ImportsController {
  constructor(private readonly importsService: ImportsService) {}

  @Post('preview')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: MAX_EXCEL_FILE_SIZE,
      },
    }),
  )
  @ApiOperation({ summary: 'Предварительно проверить Excel-файл с клиентами' })
  @ApiOkResponse({
    description: 'Excel-файл успешно прочитан',
    type: ImportPreviewDto,
  })
  @ApiBadRequestResponse({
    description: 'Некорректный идентификатор компании или Excel-файл',
    type: ImportErrorDto,
  })
  @ApiNotFoundResponse({
    description: 'Компания не найдена',
    type: ImportErrorDto,
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  async preview(
    @Param('companyId', ParseUUIDPipe) companyId: string,
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({
          fileType: XLSX_MIME_TYPE,
        })
        .addMaxSizeValidator({
          maxSize: MAX_EXCEL_FILE_SIZE,
        })
        .build(),
    )
    file: Express.Multer.File,
  ) {
    const preview = await this.importsService.preview(companyId, file.buffer);

    return {
      companyId,
      ...preview,
    };
  }

  @Post()
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: MAX_EXCEL_FILE_SIZE,
      },
    }),
  )
  @ApiOperation({
    summary: 'Импортировать клиентов и оборудование из Excel',
  })
  @ApiOkResponse({
    description: 'Клиенты и оборудование успешно импортированы',
    type: ImportResultDto,
  })
  @ApiBadRequestResponse({
    description: 'Некорректный идентификатор, файл или previewHash',
    type: ImportErrorDto,
  })
  @ApiNotFoundResponse({
    description: 'Компания не найдена',
    type: ImportErrorDto,
  })
  @ApiConflictResponse({
    description: 'Файл отличается от проверенного через preview',
    type: ImportErrorDto,
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file', 'previewHash'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        previewHash: {
          type: 'string',
          example:
            '9d62a91fc33c957b545c87a2dc08668caf323f2714c08f0cbd91d3dc6f4b9519',
        },
      },
    },
  })
  async importClients(
    @Param('companyId', ParseUUIDPipe) companyId: string,
    @Body() importClientsDto: ImportClientsDto,
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({
          fileType: XLSX_MIME_TYPE,
        })
        .addMaxSizeValidator({
          maxSize: MAX_EXCEL_FILE_SIZE,
        })
        .build(),
    )
    file: Express.Multer.File,
  ) {
    const result = await this.importsService.importClients(
      companyId,
      file.buffer,
      importClientsDto.previewHash,
    );

    return {
      companyId,
      ...result,
    };
  }
}
