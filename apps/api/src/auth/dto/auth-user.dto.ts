import { ApiProperty } from '@nestjs/swagger';

export class AuthUserDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'owner@example.com' })
  email!: string;

  @ApiProperty({ format: 'uuid' })
  companyId!: string;
}
