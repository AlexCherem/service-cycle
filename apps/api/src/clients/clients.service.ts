import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../database/prisma/prisma.service';
import type { Prisma } from '../generated/prisma/client';
import { ListClientsQueryDto } from './dto/list-clients-query.dto';
import {
  ClientListItemDto,
  ListClientsResponseDto,
} from './dto/list-clients-response.dto';
import {
  calculateEquipmentServiceStatus,
  createEquipmentServiceStatusWhere,
  getBusinessToday,
} from './utils/calculate-equipment-service-status';

const toDateOnly = (value: Date | null): string | null => {
  return value ? value.toISOString().slice(0, 10) : null;
};

@Injectable()
export class ClientsService {
  constructor(private readonly prisma: PrismaService) {}

  async findOne(
    companyId: string,
    clientId: string,
  ): Promise<ClientListItemDto> {
    const client = await this.prisma.client.findFirst({
      where: {
        id: clientId,
        companyId,
      },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        equipment: {
          select: {
            id: true,
            name: true,
            installationDate: true,
            lastServiceDate: true,
            nextServiceDate: true,
          },
          orderBy: [{ name: 'asc' }, { id: 'asc' }],
        },
      },
    });

    if (!client) {
      throw new NotFoundException('Клиент не найден');
    }

    const today = getBusinessToday();

    return {
      id: client.id,
      name: client.name,
      phone: client.phone,
      email: client.email,
      equipment: client.equipment.map((item) => ({
        id: item.id,
        name: item.name,
        installationDate: toDateOnly(item.installationDate),
        lastServiceDate: toDateOnly(item.lastServiceDate),
        nextServiceDate: toDateOnly(item.nextServiceDate),
        status: calculateEquipmentServiceStatus(item.nextServiceDate, today),
      })),
    };
  }

  async findAll(
    companyId: string,
    query: ListClientsQueryDto,
  ): Promise<ListClientsResponseDto> {
    await this.ensureCompanyExists(companyId);

    const { page, limit, search, status } = query;
    const skip = (page - 1) * limit;
    const normalizedSearch = search?.trim();

    const today = getBusinessToday();

    const equipmentWhere: Prisma.EquipmentWhereInput | undefined = status
      ? {
          companyId,
          ...createEquipmentServiceStatusWhere(status, today),
        }
      : undefined;

    const where: Prisma.ClientWhereInput = {
      companyId,
      ...(normalizedSearch
        ? {
            OR: [
              {
                name: {
                  contains: normalizedSearch,
                  mode: 'insensitive' as const,
                },
              },
              {
                phone: {
                  contains: normalizedSearch,
                },
              },
            ],
          }
        : {}),
      ...(equipmentWhere
        ? {
            equipment: {
              some: equipmentWhere,
            },
          }
        : {}),
    };

    const [clients, total] = await this.prisma.$transaction([
      this.prisma.client.findMany({
        where,
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
          equipment: {
            ...(equipmentWhere
              ? {
                  where: equipmentWhere,
                }
              : {}),
            select: {
              id: true,
              name: true,
              installationDate: true,
              lastServiceDate: true,
              nextServiceDate: true,
            },
            orderBy: [{ name: 'asc' }, { id: 'asc' }],
          },
        },
        orderBy: [{ name: 'asc' }, { id: 'asc' }],
        skip,
        take: limit,
      }),
      this.prisma.client.count({
        where,
      }),
    ]);

    return {
      items: clients.map((client) => ({
        id: client.id,
        name: client.name,
        phone: client.phone,
        email: client.email,
        equipment: client.equipment.map((item) => ({
          id: item.id,
          name: item.name,
          installationDate: toDateOnly(item.installationDate),
          lastServiceDate: toDateOnly(item.lastServiceDate),
          nextServiceDate: toDateOnly(item.nextServiceDate),
          status: calculateEquipmentServiceStatus(item.nextServiceDate, today),
        })),
      })),
      total,
      page,
      limit,
    };
  }

  private async ensureCompanyExists(companyId: string): Promise<void> {
    const company = await this.prisma.company.findUnique({
      where: {
        id: companyId,
      },
      select: {
        id: true,
      },
    });

    if (!company) {
      throw new NotFoundException('Компания не найдена');
    }
  }
}
