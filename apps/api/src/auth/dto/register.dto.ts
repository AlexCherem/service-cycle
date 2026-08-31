import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    example: 'ООО ТеплоСервис',
    minLength: 2,
    maxLength: 120,
  })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  companyName!: string;

  @ApiProperty({
    example: 'owner@example.com',
    format: 'email',
    maxLength: 254,
  })
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @ApiProperty({
    example: 'secure-password1',
    minLength: 8,
    maxLength: 72,
    writeOnly: true,
  })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  @Matches(/^(?=.*[A-Za-z])(?=.*\d)\S+$/, {
    message:
      'Пароль должен содержать латинскую букву, цифру и не должен содержать пробелы',
  })
  password!: string;
}
