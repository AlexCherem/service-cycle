import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';

export class UpdateEquipmentDto {
  @ApiPropertyOptional({
    type: String,
    example: 'Газовый котёл',
    description: 'Название оборудования. Не может быть пустым или null.',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @ValidateIf((_object: unknown, value: unknown) => value !== undefined)
  @IsString()
  @IsNotEmpty()
  name?: string;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    example: 'Газовый котёл',
  })
  @IsOptional()
  @IsString()
  type?: string | null;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    example: 'Vaillant',
  })
  @IsOptional()
  @IsString()
  manufacturer?: string | null;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    example: 'ecoTEC plus',
  })
  @IsOptional()
  @IsString()
  model?: string | null;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    example: '2118700012345678',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsOptional()
  @IsString()
  serialNumber?: string | null;

  @ApiPropertyOptional({
    type: 'integer',
    nullable: true,
    minimum: 1,
    maximum: 2147483647,
    example: 12,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(2147483647)
  serviceIntervalMonths?: number | null;

  @ApiPropertyOptional({
    type: String,
    format: 'date',
    nullable: true,
    example: '2022-09-15',
  })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'installationDate должна иметь формат YYYY-MM-DD',
  })
  @IsDateString({ strict: true })
  installationDate?: string | null;

  @ApiPropertyOptional({
    type: String,
    format: 'date',
    nullable: true,
    example: '2025-09-15',
  })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'lastServiceDate должна иметь формат YYYY-MM-DD',
  })
  @IsDateString({ strict: true })
  lastServiceDate?: string | null;

  @ApiPropertyOptional({
    type: String,
    format: 'date',
    nullable: true,
    example: '2026-09-15',
  })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'nextServiceDate должна иметь формат YYYY-MM-DD',
  })
  @IsDateString({ strict: true })
  nextServiceDate?: string | null;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    example: 'Доступ в котельную через администратора',
    description: 'Передайте null, чтобы очистить заметку.',
  })
  @IsOptional()
  @IsString()
  notes?: string | null;
}
