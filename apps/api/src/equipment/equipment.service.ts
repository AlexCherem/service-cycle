import { Injectable } from '@nestjs/common';

import { PrismaService } from '../database/prisma/prisma.service';
import type { Prisma } from '../generated/prisma/client';
import { ListEquipmentQueryDto } from './dto/list-equipment-query.dto';
import { ListEquipmentResponseDto } from './dto/list-equipment-response.dto';
import {
  calculateEquipmentServiceStatus,
  createEquipmentServiceStatusWhere,
  getBusinessToday,
} from './utils/calculate-equipment-service-status';

const toDateOnly = (value: Date | null): string | null => {
  return value ? value.toISOString().slice(0, 10) : null;
};

@Injectable()
export class EquipmentService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    companyId: string,
    query: ListEquipmentQueryDto,
  ): Promise<ListEquipmentResponseDto> {
    const { page, limit, search, status, clientId } = query;
    const skip = (page - 1) * limit;
    const normalizedSearch = search?.trim();
    const today = getBusinessToday();

    const statusWhere = status
      ? createEquipmentServiceStatusWhere(status, today)
      : {};

    const where: Prisma.EquipmentWhereInput = {
      companyId,
      ...statusWhere,
      ...(clientId ? { clientId } : {}),
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
                client: {
                  name: {
                    contains: normalizedSearch,
                    mode: 'insensitive' as const,
                  },
                },
              },
            ],
          }
        : {}),
    };

    const [equipment, total] = await this.prisma.$transaction([
      this.prisma.equipment.findMany({
        where,
        select: {
          id: true,
          name: true,
          installationDate: true,
          lastServiceDate: true,
          nextServiceDate: true,
          client: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: [
          {
            nextServiceDate: 'asc',
          },
          {
            name: 'asc',
          },
          {
            id: 'asc',
          },
        ],
        skip,
        take: limit,
      }),
      this.prisma.equipment.count({
        where,
      }),
    ]);

    return {
      items: equipment.map((item) => ({
        id: item.id,
        name: item.name,
        client: item.client,
        installationDate: toDateOnly(item.installationDate),
        lastServiceDate: toDateOnly(item.lastServiceDate),
        nextServiceDate: toDateOnly(item.nextServiceDate),
        status: calculateEquipmentServiceStatus(item.nextServiceDate, today),
      })),
      total,
      page,
      limit,
    };
  }
}
