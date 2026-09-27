import { ApiProperty } from '@nestjs/swagger';

import { EquipmentListItemDto } from './list-equipment-response.dto';

export class EquipmentDetailsResponseDto extends EquipmentListItemDto {
  @ApiProperty({
    type: String,
    nullable: true,
    example: 'Газовый котёл',
  })
  type!: string | null;

  @ApiProperty({
    type: String,
    nullable: true,
    example: 'Bosch',
  })
  manufacturer!: string | null;

  @ApiProperty({
    type: String,
    nullable: true,
    example: 'Gaz 6000 W',
  })
  model!: string | null;

  @ApiProperty({
    type: String,
    nullable: true,
    example: 'SN-123456',
  })
  serialNumber!: string | null;

  @ApiProperty({
    type: 'integer',
    nullable: true,
    example: 12,
  })
  serviceIntervalMonths!: number | null;

  @ApiProperty({
    type: String,
    nullable: true,
    example: 'Оборудование установлено в котельной',
  })
  notes!: string | null;
}
