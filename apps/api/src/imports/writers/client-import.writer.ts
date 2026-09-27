import { ConflictException, Injectable } from '@nestjs/common';

import { PrismaService } from '../../database/prisma/prisma.service';
import { Prisma } from '../../generated/prisma/client';
import type { ClientImportRow } from '../parsers/client-import.parser';
import { toPrismaDate } from '../utils/to-prisma-date';
import { validateEquipmentMatches } from '../utils/validate-equipment-matches';
import {
  collectClients,
  collectEquipment,
} from './client-import-write.helpers';

@Injectable()
export class ClientImportWriter {
  constructor(private readonly prisma: PrismaService) {}

  async write(companyId: string, rows: ClientImportRow[]) {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        return await this.writeOnce(companyId, rows);
      } catch (error) {
        if (
          !(error instanceof Prisma.PrismaClientKnownRequestError) ||
          error.code !== 'P2034'
        )
          throw error;
        if (attempt === 2)
          throw new ConflictException(
            'Данные изменяются другим запросом. Повторите импорт',
          );
      }
    }
    throw new ConflictException('Повторите импорт');
  }

  private async writeOnce(companyId: string, rows: ClientImportRow[]) {
    const clients = collectClients(rows);

    return this.prisma.$transaction(
      async (transaction) => {
        const checkedRows = await validateEquipmentMatches(
          transaction,
          companyId,
          rows,
        );
        if (checkedRows.some((row) => !row.isValid)) {
          throw new ConflictException(
            'Данные оборудования требуют уточнения. Выполните предпросмотр ещё раз',
          );
        }
        const existingClients = await transaction.client.findMany({
          where: {
            companyId,
            phone: {
              in: clients.map((client) => client.phone),
            },
          },
          select: {
            phone: true,
          },
        });

        const existingClientPhones = new Set(
          existingClients.flatMap((client) =>
            client.phone ? [client.phone] : [],
          ),
        );

        const clientIdsByPhone = new Map<string, string>();

        let createdClientCount = 0;
        let updatedClientCount = 0;

        for (const clientData of clients) {
          const client = await transaction.client.upsert({
            where: {
              companyId_phone: {
                companyId,
                phone: clientData.phone,
              },
            },
            update: {
              name: clientData.name,
              ...(clientData.email ? { email: clientData.email } : {}),
            },
            create: {
              companyId,
              ...clientData,
            },
          });

          clientIdsByPhone.set(clientData.phone, client.id);

          if (existingClientPhones.has(clientData.phone)) {
            updatedClientCount += 1;
          } else {
            createdClientCount += 1;
          }
        }

        const equipment = collectEquipment(rows, clientIdsByPhone);

        let createdEquipmentCount = 0;
        let updatedEquipmentCount = 0;

        for (const equipmentData of equipment) {
          const matches = await transaction.equipment.findMany({
            where: {
              companyId,
              clientId: equipmentData.clientId,
              client: { companyId },
              serialNumber: equipmentData.serialNumber,
            },
            select: { id: true },
            take: 2,
          });
          if (matches.length > 1) {
            throw new ConflictException(
              'Неоднозначный серийный номер. Выполните предпросмотр ещё раз',
            );
          }

          const equipmentDetails = {
            ...(equipmentData.type ? { type: equipmentData.type } : {}),
            ...(equipmentData.manufacturer
              ? { manufacturer: equipmentData.manufacturer }
              : {}),
            ...(equipmentData.model ? { model: equipmentData.model } : {}),
            ...(equipmentData.serialNumber
              ? { serialNumber: equipmentData.serialNumber }
              : {}),
            ...(equipmentData.serviceIntervalMonths !== null
              ? { serviceIntervalMonths: equipmentData.serviceIntervalMonths }
              : {}),
            ...(equipmentData.notes ? { notes: equipmentData.notes } : {}),
          };

          const equipmentDates = {
            installationDate: toPrismaDate(equipmentData.installationDate),
            lastServiceDate: toPrismaDate(equipmentData.lastServiceDate),
            nextServiceDate: toPrismaDate(equipmentData.nextServiceDate),
          };

          const equipmentDateUpdates = {
            ...(equipmentDates.installationDate
              ? { installationDate: equipmentDates.installationDate }
              : {}),
            ...(equipmentDates.lastServiceDate
              ? { lastServiceDate: equipmentDates.lastServiceDate }
              : {}),
            ...(equipmentDates.nextServiceDate
              ? { nextServiceDate: equipmentDates.nextServiceDate }
              : {}),
          };

          if (matches[0]) {
            await transaction.equipment.update({
              where: {
                id: matches[0].id,
                companyId,
                clientId: equipmentData.clientId,
                client: { companyId },
              },
              data: {
                name: equipmentData.name,
                ...equipmentDetails,
                ...equipmentDateUpdates,
              },
            });
            updatedEquipmentCount += 1;
          } else {
            await transaction.equipment.create({
              data: {
                companyId,
                clientId: equipmentData.clientId,
                name: equipmentData.name,
                ...equipmentDetails,
                ...equipmentDates,
              },
            });
            createdEquipmentCount += 1;
          }
        }

        return {
          createdClientCount,
          updatedClientCount,
          createdEquipmentCount,
          updatedEquipmentCount,
        };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }
}
