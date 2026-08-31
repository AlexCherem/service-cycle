import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ClientsModule } from './clients/clients.module';
import { CompaniesModule } from './companies/companies.module';
import { PrismaModule } from './database/prisma/prisma.module';
import { ImportsModule } from './imports/imports.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    CompaniesModule,
    ClientsModule,
    ImportsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
