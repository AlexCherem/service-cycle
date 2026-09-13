import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

import { EquipmentServiceStatus } from './equipment-service-status.enum';

export class ListEquipmentQueryDto {
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
    description: 'Поиск по названию оборудования или имени клиента',
    example: 'котёл',
    maxLength: 120,
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;

  @ApiPropertyOptional({
    description: 'Фильтр по сервисному статусу оборудования',
    enum: EquipmentServiceStatus,
    enumName: 'EquipmentServiceStatus',
    example: EquipmentServiceStatus.DUE_SOON,
  })
  @IsOptional()
  @IsEnum(EquipmentServiceStatus)
  status?: EquipmentServiceStatus;

  @ApiPropertyOptional({
    description: 'Фильтр по клиенту',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  clientId?: string;
}
