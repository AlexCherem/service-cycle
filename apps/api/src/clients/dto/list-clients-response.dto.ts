import { ApiProperty } from '@nestjs/swagger';

export class ClientEquipmentListItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Газовый котёл' })
  name!: string;

  @ApiProperty({
    example: '2025-05-10',
    format: 'date',
    nullable: true,
    type: String,
  })
  installationDate!: string | null;

  @ApiProperty({
    example: '2025-09-15',
    format: 'date',
    nullable: true,
    type: String,
  })
  lastServiceDate!: string | null;

  @ApiProperty({
    example: '2026-09-15',
    format: 'date',
    nullable: true,
    type: String,
  })
  nextServiceDate!: string | null;
}

export class ClientListItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Иван Иванов' })
  name!: string;

  @ApiProperty({
    example: '+375291234567',
    nullable: true,
    type: String,
  })
  phone!: string | null;

  @ApiProperty({
    example: 'ivan@example.com',
    nullable: true,
    type: String,
  })
  email!: string | null;

  @ApiProperty({ type: () => [ClientEquipmentListItemDto] })
  equipment!: ClientEquipmentListItemDto[];
}

export class ListClientsResponseDto {
  @ApiProperty({ type: () => [ClientListItemDto] })
  items!: ClientListItemDto[];

  @ApiProperty({
    example: 125,
    minimum: 0,
  })
  total!: number;

  @ApiProperty({
    example: 1,
    minimum: 1,
  })
  page!: number;

  @ApiProperty({
    example: 20,
    minimum: 1,
    maximum: 100,
  })
  limit!: number;
}
