import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  ValidateIf,
} from 'class-validator';

import { normalizeBelarusPhone } from '../../common/utils/normalize-belarus-phone';

export class UpdateClientDto {
  @ApiPropertyOptional({
    type: String,
    example: 'Иван Иванов',
    description: 'Имя клиента. Не может быть пустым или null.',
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
    format: 'email',
    nullable: true,
    maxLength: 254,
    example: 'ivan@example.com',
    description: 'Email клиента. Передайте null, чтобы очистить.',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsOptional()
  @IsEmail()
  @MaxLength(254)
  email?: string | null;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    example: '+375291234567',
    description:
      'Телефон клиента. Приводится к формату +375XXXXXXXXX. Передайте null, чтобы очистить.',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string'
      ? (normalizeBelarusPhone(value) ?? value.trim())
      : value,
  )
  @IsOptional()
  @IsString()
  @Matches(/^\+375\d{9}$/, {
    message: 'Укажите корректный белорусский номер телефона',
  })
  phone?: string | null;
}
