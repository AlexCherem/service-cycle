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
    example: 'Тип оборудования',
    nullable: true,
    type: String,
  })
  type!: string | null;

  @ApiProperty({
    example: 'Производитель',
    nullable: true,
    type: String,
  })
  manufacturer!: string | null;

  @ApiProperty({
    example: 'Модель',
    nullable: true,
    type: String,
  })
  model!: string | null;

  @ApiProperty({
    example: 'Серийный номер',
    nullable: true,
    type: String,
  })
  serialNumber!: string | null;

  @ApiProperty({
    example: 'Интервал обслуживания (мес.)',
    nullable: true,
    type: String,
  })
  serviceIntervalMonths!: string | null;

  @ApiProperty({
    example: 'Примечание к оборудованию',
    nullable: true,
    type: String,
  })
  notes!: string | null;

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
    example: 'Газовый котёл',
    nullable: true,
    type: String,
  })
  type!: string | null;

  @ApiProperty({
    example: 'Vaillant',
    nullable: true,
    type: String,
  })
  manufacturer!: string | null;

  @ApiProperty({
    example: 'ecoTEC plus',
    nullable: true,
    type: String,
  })
  model!: string | null;

  @ApiProperty({
    example: 'SN-123456',
    nullable: true,
    type: String,
  })
  serialNumber!: string | null;

  @ApiProperty({
    example: 12,
    minimum: 1,
    nullable: true,
    type: Number,
  })
  serviceIntervalMonths!: number | null;

  @ApiProperty({
    example: 'Установлен в подвальном помещении',
    nullable: true,
    type: String,
  })
  notes!: string | null;

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
      'Клиент',
      'Телефон',
      'Email',
      'Оборудование',
      'Тип оборудования',
      'Производитель',
      'Модель',
      'Серийный номер',
      'Дата установки',
      'Интервал обслуживания (мес.)',
      'Дата последнего обслуживания',
      'Дата следующего обслуживания',
      'Примечание к оборудованию',
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
