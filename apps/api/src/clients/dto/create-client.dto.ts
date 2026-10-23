import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

import { normalizeBelarusPhone } from '../../common/utils/normalize-belarus-phone';

export class CreateClientDto {
  @ApiProperty({ example: 'Иван Иванов' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({
    example: '+375291234567',
    description: 'Телефон приводится к формату +375XXXXXXXXX.',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string'
      ? (normalizeBelarusPhone(value) ?? value.trim())
      : value,
  )
  @IsString()
  @Matches(/^\+375\d{9}$/, {
    message: 'Укажите корректный белорусский номер телефона',
  })
  phone!: string;

  @ApiPropertyOptional({
    type: String,
    format: 'email',
    nullable: true,
    maxLength: 254,
    example: 'ivan@example.com',
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
    maxLength: 300,
    example: 'Перед визитом позвонить за час.',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsOptional()
  @IsString()
  @MaxLength(300, {
    message: 'Примечание не должно превышать 300 символов',
  })
  notes?: string | null;
}
