import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../database/prisma/prisma.module';
import { ClientsController } from './clients.controller';
import { ClientsService } from './clients.service';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [ClientsController],
  providers: [ClientsService],
})
export class ClientsModule {}
