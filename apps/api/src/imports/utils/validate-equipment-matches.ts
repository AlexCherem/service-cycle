import { getEquipmentDateErrors } from '../../equipment/utils/get-equipment-date-errors';
import type { Prisma } from '../../generated/prisma/client';
import type { ClientImportRow } from '../parsers/client-import.parser';

// Shared by preview and commit; commit must repeat this against current data.
export const validateEquipmentMatches = async (
  database: Pick<Prisma.TransactionClient, 'equipment'>,
  companyId: string,
  rows: ClientImportRow[],
): Promise<ClientImportRow[]> => {
  const key = (phone: string, serial: string) =>
    JSON.stringify([phone, serial]);
  const counts = new Map<string, number>();
  for (const row of rows) {
    const serial = row.data.serialNumber?.trim();
    if (serial) {
      const identity = key(row.data.phone, serial);
      counts.set(identity, (counts.get(identity) ?? 0) + 1);
    }
  }

  const candidates = rows.filter(
    (row) => row.isValid && row.data.serialNumber?.trim(),
  );
  const existing = candidates.length
    ? await database.equipment.findMany({
        where: {
          companyId,
          client: { companyId },
          OR: candidates.map((row) => ({
            serialNumber: row.data.serialNumber!.trim(),
            client: { phone: row.data.phone },
          })),
        },
        select: {
          serialNumber: true,
          installationDate: true,
          lastServiceDate: true,
          nextServiceDate: true,
          client: { select: { phone: true } },
        },
      })
    : [];
  const matches = new Map<string, typeof existing>();
  for (const item of existing) {
    if (item.client.phone && item.serialNumber) {
      const identity = key(item.client.phone, item.serialNumber);
      matches.set(identity, [...(matches.get(identity) ?? []), item]);
    }
  }

  return rows.map((row) => {
    const serial = row.data.serialNumber?.trim() || null;
    const errors = [...row.errors];
    if (!serial) {
      errors.push(
        'Для импорта оборудования укажите серийный номер. Без него нельзя безопасно определить повторную загрузку',
      );
    } else {
      const identity = key(row.data.phone, serial);
      if ((counts.get(identity) ?? 0) > 1) {
        errors.push(
          'Серийный номер повторяется у этого клиента в файле. Оставьте одну строку для устройства',
        );
      }
      if ((matches.get(identity)?.length ?? 0) > 1) {
        errors.push(
          'У клиента найдено несколько устройств с этим серийным номером. Уточните номера в карточках оборудования',
        );
      }
      const stored = matches.get(identity)?.[0];
      if (row.isValid && (matches.get(identity)?.length ?? 0) <= 1) {
        errors.push(
          ...getEquipmentDateErrors({
            installationDate:
              row.data.installationDate ?? stored?.installationDate ?? null,
            lastServiceDate:
              row.data.lastServiceDate ?? stored?.lastServiceDate ?? null,
            nextServiceDate:
              row.data.nextServiceDate ?? stored?.nextServiceDate ?? null,
          }),
        );
      }
    }
    return {
      ...row,
      data: { ...row.data, serialNumber: serial },
      errors,
      isValid: errors.length === 0,
    };
  });
};
