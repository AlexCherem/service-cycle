import { ApiProperty } from '@nestjs/swagger';

export class ImportErrorDto {
  @ApiProperty({ example: 400 })
  statusCode!: number;

  @ApiProperty({
    example: 'Не удалось прочитать Excel-файл',
  })
  message!: string;

  @ApiProperty({ example: 'Bad Request' })
  error!: string;
}
