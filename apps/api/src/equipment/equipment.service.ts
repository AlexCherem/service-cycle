import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../database/prisma/prisma.service';
import { Prisma } from '../generated/prisma/client';
import { EquipmentDetailsResponseDto } from './dto/equipment-details-response.dto';
import { ListEquipmentQueryDto } from './dto/list-equipment-query.dto';
import { ListEquipmentResponseDto } from './dto/list-equipment-response.dto';
import { UpdateEquipmentDto } from './dto/update-equipment.dto';
import {
  calculateEquipmentServiceStatus,
  createEquipmentServiceStatusWhere,
  getBusinessToday,
} from './utils/calculate-equipment-service-status';
import { getEquipmentDateErrors } from './utils/get-equipment-date-errors';

const toDateOnly = (value: Date | null): string | null => {
  return value ? value.toISOString().slice(0, 10) : null;
};

const toPrismaDate = (
  value: string | null | undefined,
): Date | null | undefined => {
  if (value === undefined || value === null) {
    return value;
  }

  return new Date(`${value}T00:00:00.000Z`);
};

const equipmentDetailsSelect = {
  id: true,
  name: true,
  type: true,
  manufacturer: true,
  model: true,
  serialNumber: true,
  serviceIntervalMonths: true,
  notes: true,
  installationDate: true,
  lastServiceDate: true,
  nextServiceDate: true,
  client: {
    select: {
      id: true,
      name: true,
    },
  },
} satisfies Prisma.EquipmentSelect;

type EquipmentDetails = Prisma.EquipmentGetPayload<{
  select: typeof equipmentDetailsSelect;
}>;

const toEquipmentDetailsResponse = (
  equipment: EquipmentDetails,
): EquipmentDetailsResponseDto => ({
  ...equipment,
  installationDate: toDateOnly(equipment.installationDate),
  lastServiceDate: toDateOnly(equipment.lastServiceDate),
  nextServiceDate: toDateOnly(equipment.nextServiceDate),
  status: calculateEquipmentServiceStatus(
    equipment.nextServiceDate,
    getBusinessToday(),
  ),
});

@Injectable()
export class EquipmentService {
  constructor(private readonly prisma: PrismaService) {}

  async findOne(
    companyId: string,
    equipmentId: string,
  ): Promise<EquipmentDetailsResponseDto> {
    const equipment = await this.prisma.equipment.findFirst({
      where: {
        id: equipmentId,
        companyId,
        client: {
          companyId,
        },
      },
      select: equipmentDetailsSelect,
    });

    if (!equipment) {
      throw new NotFoundException('Оборудование не найдено');
    }

    return toEquipmentDetailsResponse(equipment);
  }

  async update(
    companyId: string,
    equipmentId: string,
    dto: UpdateEquipmentDto,
  ): Promise<EquipmentDetailsResponseDto> {
    try {
      return await this.prisma.$transaction(async (transaction) => {
        const equipment = await transaction.equipment.update({
          where: {
            id: equipmentId,
            companyId,
            client: {
              companyId,
            },
          },
          data: {
            name: dto.name,
            type: dto.type,
            manufacturer: dto.manufacturer,
            model: dto.model,
            serialNumber: dto.serialNumber,
            serviceIntervalMonths: dto.serviceIntervalMonths,
            notes: dto.notes,
            installationDate: toPrismaDate(dto.installationDate),
            lastServiceDate: toPrismaDate(dto.lastServiceDate),
            nextServiceDate: toPrismaDate(dto.nextServiceDate),
          },
          select: equipmentDetailsSelect,
        });

        // Validate the actual merged record while the update holds its row lock.
        // Throwing here rolls back the update, including updatedAt.
        const dateErrors = getEquipmentDateErrors(equipment);
        if (dateErrors.length > 0) {
          throw new BadRequestException(dateErrors);
        }
        return toEquipmentDetailsResponse(equipment);
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException('Оборудование не найдено');
        }
      }

      throw error;
    }
  }

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
