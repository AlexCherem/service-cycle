import { ClientImportParser } from '../parsers/client-import.parser';
import { createClientImportTemplate } from './client-import-template';

describe('createClientImportTemplate', () => {
  it('creates an Excel template recognized by the import parser', async () => {
    const templateBuffer = await createClientImportTemplate();
    const parser = new ClientImportParser();

    const result = await parser.parse(templateBuffer);

    expect(result.worksheetName).toBe('Клиенты');
    expect(result.rowCount).toBe(1);
    expect(result.columnCount).toBe(13);

    expect(result.headers).toEqual([
      'Клиент',
      'Телефон',
      'Email',
      'Оборудование',
      'Тип оборудования',
      'Производитель',
      'Модель',
      'Серийный номер',
      'Дата установки',
      'Интервал обслуживания (мес.)',
      'Дата последнего обслуживания',
      'Дата следующего обслуживания',
      'Примечание к оборудованию',
    ]);

    expect(result.detectedColumns).toEqual({
      name: 'Клиент',
      phone: 'Телефон',
      email: 'Email',
      equipment: 'Оборудование',
      type: 'Тип оборудования',
      manufacturer: 'Производитель',
      model: 'Модель',
      serialNumber: 'Серийный номер',
      serviceIntervalMonths: 'Интервал обслуживания (мес.)',
      notes: 'Примечание к оборудованию',
      installationDate: 'Дата установки',
      lastServiceDate: 'Дата последнего обслуживания',
      nextServiceDate: 'Дата следующего обслуживания',
    });

    expect(result.rows).toEqual([]);
  });
});
