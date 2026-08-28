import { ApiProperty } from '@nestjs/swagger';

export class ImportDetectedColumnsDto {
  @ApiProperty({ example: 'ФИО' })
  name!: string;

  @ApiProperty({ example: 'Телефон' })
  phone!: string;

  @ApiProperty({
    example: 'Email',
    nullable: true,
    type: String,
  })
  email!: string | null;

  @ApiProperty({ example: 'Оборудование' })
  equipment!: string;

  @ApiProperty({
    example: 'Дата установки',
    nullable: true,
    type: String,
  })
  installationDate!: string | null;

  @ApiProperty({
    example: 'Дата последнего обслуживания',
    nullable: true,
    type: String,
  })
  lastServiceDate!: string | null;

  @ApiProperty({
    example: 'Дата следующего обслуживания',
    nullable: true,
    type: String,
  })
  nextServiceDate!: string | null;
}

export class ImportClientDataDto {
  @ApiProperty({ example: 'Иван Иванов' })
  name!: string;

  @ApiProperty({ example: '+375291234567' })
  phone!: string;

  @ApiProperty({
    example: 'ivan@example.com',
    nullable: true,
    type: String,
  })
  email!: string | null;

  @ApiProperty({ example: 'Газовый котёл' })
  equipment!: string;

  @ApiProperty({
    example: '2025-05-10',
    format: 'date',
    nullable: true,
    type: String,
  })
  installationDate!: string | null;

  @ApiProperty({
    example: '2025-09-15',
    format: 'date',
    nullable: true,
    type: String,
  })
  lastServiceDate!: string | null;

  @ApiProperty({
    example: '2026-09-15',
    format: 'date',
    nullable: true,
    type: String,
  })
  nextServiceDate!: string | null;
}

export class ImportPreviewRowDto {
  @ApiProperty({ example: 2 })
  rowNumber!: number;

  @ApiProperty({ type: () => ImportClientDataDto })
  data!: ImportClientDataDto;

  @ApiProperty({ example: true })
  isValid!: boolean;

  @ApiProperty({
    example: [],
    type: [String],
  })
  errors!: string[];

  @ApiProperty({
    example: ['Не назначена дата следующего обслуживания'],
    type: [String],
  })
  warnings!: string[];
}

export class ImportPreviewDto {
  @ApiProperty({ format: 'uuid' })
  companyId!: string;

  @ApiProperty({
    example: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
    description: 'SHA-256 хеш проверенного Excel-файла',
  })
  fileHash!: string;

  @ApiProperty({ example: 'Клиенты' })
  worksheetName!: string;

  @ApiProperty({
    example: 6,
    description: 'Количество строк вместе со строкой заголовков',
  })
  rowCount!: number;

  @ApiProperty({ example: 3 })
  columnCount!: number;

  @ApiProperty({
    example: [
      'ФИО',
      'Телефон',
      'Email',
      'Оборудование',
      'Дата установки',
      'Дата последнего обслуживания',
      'Дата следующего обслуживания',
    ],
    type: [String],
  })
  headers!: string[];

  @ApiProperty({ type: () => ImportDetectedColumnsDto })
  detectedColumns!: ImportDetectedColumnsDto;

  @ApiProperty({ example: 5 })
  validRowCount!: number;

  @ApiProperty({ example: 0 })
  invalidRowCount!: number;

  @ApiProperty({ type: () => [ImportPreviewRowDto] })
  rows!: ImportPreviewRowDto[];
}
