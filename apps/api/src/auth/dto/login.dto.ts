import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
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
    minLength: 1,
    maxLength: 72,
    writeOnly: true,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(72)
  password!: string;
}
