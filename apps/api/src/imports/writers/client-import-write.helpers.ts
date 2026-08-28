import type { ClientImportRow } from '../parsers/client-import.parser';

export type ClientWriteData = Pick<
  ClientImportRow['data'],
  'name' | 'phone' | 'email'
>;

export type EquipmentWriteData = {
  clientId: string;
  name: string;
  installationDate: string | null;
  lastServiceDate: string | null;
  nextServiceDate: string | null;
};

export const getEquipmentKey = (clientId: string, name: string): string => {
  return `${clientId}:${name}`;
};

export const collectClients = (rows: ClientImportRow[]): ClientWriteData[] => {
  const clientsByPhone = new Map<string, ClientWriteData>();

  for (const row of rows) {
    const existingClient = clientsByPhone.get(row.data.phone);

    clientsByPhone.set(row.data.phone, {
      name: row.data.name,
      phone: row.data.phone,
      email: row.data.email ?? existingClient?.email ?? null,
    });
  }

  return [...clientsByPhone.values()];
};

export const collectEquipment = (
  rows: ClientImportRow[],
  clientIdsByPhone: Map<string, string>,
): EquipmentWriteData[] => {
  const equipmentByKey = new Map<string, EquipmentWriteData>();

  for (const row of rows) {
    const clientId = clientIdsByPhone.get(row.data.phone);

    if (!clientId) {
      throw new Error(
        `Не удалось определить клиента для телефона ${row.data.phone}`,
      );
    }

    const equipmentKey = getEquipmentKey(clientId, row.data.equipment);
    const existingEquipment = equipmentByKey.get(equipmentKey);

    equipmentByKey.set(equipmentKey, {
      clientId,
      name: row.data.equipment,
      installationDate:
        row.data.installationDate ??
        existingEquipment?.installationDate ??
        null,
      lastServiceDate:
        row.data.lastServiceDate ?? existingEquipment?.lastServiceDate ?? null,
      nextServiceDate:
        row.data.nextServiceDate ?? existingEquipment?.nextServiceDate ?? null,
    });
  }

  return [...equipmentByKey.values()];
};
