import { ApiProperty } from '@nestjs/swagger';

export class ImportResultDto {
  @ApiProperty({ format: 'uuid' })
  companyId!: string;

  @ApiProperty({
    example: '9d62a91fc33c957b545c87a2dc08668caf323f2714c08f0cbd91d3dc6f4b9519',
  })
  fileHash!: string;

  @ApiProperty({
    example: 6,
    description: 'Количество сохранённых корректных строк',
  })
  importedRowCount!: number;

  @ApiProperty({
    example: 2,
    description: 'Количество пропущенных строк с ошибками',
  })
  skippedRowCount!: number;

  @ApiProperty({
    example: 5,
    description: 'Количество созданных клиентов',
  })
  createdClientCount!: number;

  @ApiProperty({
    example: 0,
    description: 'Количество обновлённых существующих клиентов',
  })
  updatedClientCount!: number;

  @ApiProperty({
    example: 6,
    description: 'Количество созданных единиц оборудования',
  })
  createdEquipmentCount!: number;

  @ApiProperty({
    example: 0,
    description: 'Количество обновлённых единиц оборудования',
  })
  updatedEquipmentCount!: number;
}
