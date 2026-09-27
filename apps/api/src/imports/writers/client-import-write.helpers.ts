import type { ClientImportRow } from '../parsers/client-import.parser';

export type ClientWriteData = Pick<
  ClientImportRow['data'],
  'name' | 'phone' | 'email'
>;

export type EquipmentWriteData = {
  clientId: string;
  name: string;
  type: string | null;
  manufacturer: string | null;
  model: string | null;
  serialNumber: string | null;
  serviceIntervalMonths: number | null;
  notes: string | null;
  installationDate: string | null;
  lastServiceDate: string | null;
  nextServiceDate: string | null;
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
  return rows.map((row) => {
    const clientId = clientIdsByPhone.get(row.data.phone);
    if (!clientId) {
      throw new Error(
        `Не удалось определить клиента для телефона ${row.data.phone}`,
      );
    }
    return {
      clientId,
      name: row.data.equipment,
      type: row.data.type,
      manufacturer: row.data.manufacturer,
      model: row.data.model,
      serialNumber: row.data.serialNumber?.trim() ?? null,
      serviceIntervalMonths: row.data.serviceIntervalMonths,
      notes: row.data.notes,
      installationDate: row.data.installationDate,
      lastServiceDate: row.data.lastServiceDate,
      nextServiceDate: row.data.nextServiceDate,
    };
  });
};
