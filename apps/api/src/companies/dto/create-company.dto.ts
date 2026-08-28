import { ApiProperty } from '@nestjs/swagger';
import { Transform, type TransformFnParams } from 'class-transformer';
import { IsString, Length } from 'class-validator';

export class CreateCompanyDto {
  @ApiProperty({ example: 'Сервисный центр', maxLength: 200 })
  @Transform(({ value }: TransformFnParams) => {
    const rawValue: unknown = value;

    return typeof rawValue === 'string' ? rawValue.trim() : rawValue;
  })
  @IsString()
  @Length(1, 200)
  name!: string;
}
