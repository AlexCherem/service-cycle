import { ApiProperty } from '@nestjs/swagger';

import { EquipmentServiceStatus } from './equipment-service-status.enum';

export class EquipmentClientDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Иван Иванов' })
  name!: string;
}

export class EquipmentListItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Газовый котёл' })
  name!: string;

  @ApiProperty({ type: () => EquipmentClientDto })
  client!: EquipmentClientDto;

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

  @ApiProperty({
    description: 'Вычисленный статус сервисного срока оборудования',
    enum: EquipmentServiceStatus,
    enumName: 'EquipmentServiceStatus',
    example: EquipmentServiceStatus.DUE_SOON,
  })
  status!: EquipmentServiceStatus;
}

export class ListEquipmentResponseDto {
  @ApiProperty({ type: () => [EquipmentListItemDto] })
  items!: EquipmentListItemDto[];

  @ApiProperty({
    example: 125,
    minimum: 0,
  })
  total!: number;

  @ApiProperty({
    example: 1,
    minimum: 1,
  })
  page!: number;

  @ApiProperty({
    example: 20,
    minimum: 1,
    maximum: 100,
  })
  limit!: number;
}
