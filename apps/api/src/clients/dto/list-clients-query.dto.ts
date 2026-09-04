import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

import { EquipmentServiceStatus } from './equipment-service-status.enum';

export class ListClientsQueryDto {
  @ApiPropertyOptional({
    default: 1,
    minimum: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({
    default: 20,
    minimum: 1,
    maximum: 100,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 20;

  @ApiPropertyOptional({
    description: 'Поиск клиента по имени или телефону',
    example: 'Иван',
    maxLength: 120,
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;

  @ApiPropertyOptional({
    description: 'Фильтр по статусу сервисного срока оборудования',
    enum: EquipmentServiceStatus,
    enumName: 'EquipmentServiceStatus',
    example: EquipmentServiceStatus.DUE_SOON,
  })
  @IsOptional()
  @IsEnum(EquipmentServiceStatus)
  status?: EquipmentServiceStatus;
}
