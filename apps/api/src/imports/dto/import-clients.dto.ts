import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';

export class ImportClientsDto {
  @ApiProperty({
    example: '9d62a91fc33c957b545c87a2dc08668caf323f2714c08f0cbd91d3dc6f4b9519',
    description: 'SHA-256 хеш файла, полученный из preview',
  })
  @IsString()
  @Matches(/^[a-f0-9]{64}$/, {
    message: 'previewHash должен быть SHA-256 хешем',
  })
  previewHash!: string;
}
