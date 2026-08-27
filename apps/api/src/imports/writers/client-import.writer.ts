import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../database/prisma/prisma.service';
import type { ClientImportRow } from '../parsers/client-import.parser';
import { toPrismaDate } from '../utils/to-prisma-date';
import {
  collectClients,
  collectEquipment,
  getEquipmentKey,
} from './client-import-write.helpers';

@Injectable()
export class ClientImportWriter {
  constructor(private readonly prisma: PrismaService) {}

  async write(companyId: string, rows: ClientImportRow[]) {
    const clients = collectClients(rows);

    return this.prisma.$transaction(async (transaction) => {
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

      const existingEquipment = await transaction.equipment.findMany({
        where: {
          OR: equipment.map((item) => ({
            clientId: item.clientId,
            name: item.name,
          })),
        },
        select: {
          clientId: true,
          name: true,
        },
      });

      const existingEquipmentKeys = new Set(
        existingEquipment.map((item) =>
          getEquipmentKey(item.clientId, item.name),
        ),
      );

      let createdEquipmentCount = 0;
      let updatedEquipmentCount = 0;

      for (const equipmentData of equipment) {
        const equipmentKey = getEquipmentKey(
          equipmentData.clientId,
          equipmentData.name,
        );

        const equipmentWhere = {
          clientId_name: {
            clientId: equipmentData.clientId,
            name: equipmentData.name,
          },
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

        await transaction.equipment.upsert({
          where: equipmentWhere,
          update: equipmentDateUpdates,
          create: {
            companyId,
            clientId: equipmentData.clientId,
            name: equipmentData.name,
            ...equipmentDates,
          },
        });

        if (existingEquipmentKeys.has(equipmentKey)) {
          updatedEquipmentCount += 1;
        } else {
          createdEquipmentCount += 1;
        }
      }

      return {
        createdClientCount,
        updatedClientCount,
        createdEquipmentCount,
        updatedEquipmentCount,
      };
    });
  }
}
