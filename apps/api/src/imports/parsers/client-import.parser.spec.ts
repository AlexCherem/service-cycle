import { BadRequestException } from '@nestjs/common';
import ExcelJS, { type CellValue } from 'exceljs';

import { ClientImportParser } from './client-import.parser';

const createWorkbookBuffer = async (rows: CellValue[][]): Promise<Buffer> => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Клиенты');

  rows.forEach((row) => {
    worksheet.addRow(row);
  });

  const excelBuffer = await workbook.xlsx.writeBuffer();

  return Buffer.from(excelBuffer);
};

describe('ClientImportParser', () => {
  let parser: ClientImportParser;

  beforeEach(() => {
    parser = new ClientImportParser();
  });

  it('parses a valid client row', async () => {
    const fileBuffer = await createWorkbookBuffer([
      [
        'ФИО',
        'Телефон',
        'Email',
        'Оборудование',
        'Дата установки',
        'Дата последнего обслуживания',
        'Дата следующего обслуживания',
      ],
      [
        'Иван Иванов',
        '29 123-45-67',
        'ivan@example.com',
        'Газовый котёл',
        '01.02.2024',
        '01.02.2025',
        '01.02.2026',
      ],
    ]);

    const result = await parser.parse(fileBuffer);

    expect(result).toEqual({
      worksheetName: 'Клиенты',
      rowCount: 2,
      columnCount: 7,
      headers: [
        'ФИО',
        'Телефон',
        'Email',
        'Оборудование',
        'Дата установки',
        'Дата последнего обслуживания',
        'Дата следующего обслуживания',
      ],
      detectedColumns: {
        name: 'ФИО',
        phone: 'Телефон',
        email: 'Email',
        equipment: 'Оборудование',
        type: null,
        manufacturer: null,
        model: null,
        serialNumber: null,
        serviceIntervalMonths: null,
        notes: null,
        installationDate: 'Дата установки',
        lastServiceDate: 'Дата последнего обслуживания',
        nextServiceDate: 'Дата следующего обслуживания',
      },
      validRowCount: 1,
      invalidRowCount: 0,
      rows: [
        {
          rowNumber: 2,
          data: {
            name: 'Иван Иванов',
            phone: '+375291234567',
            email: 'ivan@example.com',
            equipment: 'Газовый котёл',
            type: null,
            manufacturer: null,
            model: null,
            serialNumber: null,
            serviceIntervalMonths: null,
            notes: null,
            installationDate: '2024-02-01',
            lastServiceDate: '2025-02-01',
            nextServiceDate: '2026-02-01',
          },
          isValid: true,
          errors: [],
          warnings: [],
        },
      ],
    });
  });

  it('parses an email stored by Numbers as a rich-text hyperlink', async () => {
    const numbersEmail = {
      text: {
        richText: [{ text: 'ivan@example.com' }],
      },
      hyperlink: 'mailto:ivan@example.com',
    } as unknown as CellValue;

    const fileBuffer = await createWorkbookBuffer([
      ['Клиент', 'Телефон', 'Email', 'Оборудование'],
      ['Иван Иванов', '+375291234567', numbersEmail, 'Газовый котёл'],
    ]);

    const result = await parser.parse(fileBuffer);

    expect(result.validRowCount).toBe(1);
    expect(result.invalidRowCount).toBe(0);
    expect(result.rows[0]?.data.email).toBe('ivan@example.com');
  });

  it('parses optional equipment details', async () => {
    const fileBuffer = await createWorkbookBuffer([
      [
        'Клиент',
        'Телефон',
        'Оборудование',
        'Тип оборудования',
        'Производитель',
        'Модель',
        'Серийный номер',
        'Интервал обслуживания (мес.)',
        'Примечание к оборудованию',
      ],
      [
        'Иван Иванов',
        '+375291234567',
        'Котёл в частном доме',
        'Газовый котёл',
        'Vaillant',
        'ecoTEC plus',
        'SN-123456',
        12,
        'Установлен в подвальном помещении',
      ],
    ]);

    const result = await parser.parse(fileBuffer);

    expect(result.detectedColumns).toEqual(
      expect.objectContaining({
        type: 'Тип оборудования',
        manufacturer: 'Производитель',
        model: 'Модель',
        serialNumber: 'Серийный номер',
        serviceIntervalMonths: 'Интервал обслуживания (мес.)',
        notes: 'Примечание к оборудованию',
      }),
    );

    expect(result.rows[0]?.data).toEqual(
      expect.objectContaining({
        equipment: 'Котёл в частном доме',
        type: 'Газовый котёл',
        manufacturer: 'Vaillant',
        model: 'ecoTEC plus',
        serialNumber: 'SN-123456',
        serviceIntervalMonths: 12,
        notes: 'Установлен в подвальном помещении',
      }),
    );

    expect(result.rows[0]?.isValid).toBe(true);
  });

  it.each([0, -12, 1.5, 'каждый год'])(
    'marks row invalid when service interval is %s',
    async (serviceInterval) => {
      const fileBuffer = await createWorkbookBuffer([
        ['Клиент', 'Телефон', 'Оборудование', 'Интервал обслуживания (мес.)'],
        ['Иван Иванов', '+375291234567', 'Газовый котёл', serviceInterval],
      ]);

      const result = await parser.parse(fileBuffer);

      expect(result.rows[0]?.isValid).toBe(false);
      expect(result.rows[0]?.data.serviceIntervalMonths).toBeNull();
      expect(result.rows[0]?.errors).toContain(
        'Интервал обслуживания должен быть целым числом больше 0',
      );
    },
  );

  it('throws BadRequestException when required columns are missing', async () => {
    const fileBuffer = await createWorkbookBuffer([
      ['Email'],
      ['ivan@example.com'],
    ]);

    const parsing = parser.parse(fileBuffer);

    await expect(parsing).rejects.toBeInstanceOf(BadRequestException);

    await expect(parsing).rejects.toThrow(
      'Не найдены обязательные колонки: ФИО, Телефон, Оборудование',
    );
  });

  it('recognizes alternative column names', async () => {
    const fileBuffer = await createWorkbookBuffer([
      [
        'Имя клиента',
        'Мобильный телефон',
        'Почта',
        'Название_оборудования',
        'Дата монтажа',
        'Дата предыдущего обслуживания',
        'Плановая дата обслуживания',
      ],
      [
        'Пётр Петров',
        '8 (029) 123-45-67',
        'petr@example.com',
        'Кондиционер',
        '2024-2-1',
        '01/02/2025',
        '01-02-2026',
      ],
    ]);

    const result = await parser.parse(fileBuffer);

    expect(result.detectedColumns).toEqual({
      name: 'Имя клиента',
      phone: 'Мобильный телефон',
      email: 'Почта',
      equipment: 'Название_оборудования',
      type: null,
      manufacturer: null,
      model: null,
      serialNumber: null,
      serviceIntervalMonths: null,
      notes: null,
      installationDate: 'Дата монтажа',
      lastServiceDate: 'Дата предыдущего обслуживания',
      nextServiceDate: 'Плановая дата обслуживания',
    });

    expect(result.rows[0]).toEqual({
      rowNumber: 2,
      data: {
        name: 'Пётр Петров',
        phone: '+375291234567',
        email: 'petr@example.com',
        equipment: 'Кондиционер',
        type: null,
        manufacturer: null,
        model: null,
        serialNumber: null,
        serviceIntervalMonths: null,
        notes: null,
        installationDate: '2024-02-01',
        lastServiceDate: '2025-02-01',
        nextServiceDate: '2026-02-01',
      },
      isValid: true,
      errors: [],
      warnings: [],
    });
  });

  it('collects all validation errors for an invalid row', async () => {
    const fileBuffer = await createWorkbookBuffer([
      [
        'ФИО',
        'Телефон',
        'Email',
        'Оборудование',
        'Дата установки',
        'Дата последнего обслуживания',
        'Дата следующего обслуживания',
      ],
      ['', '', 'invalid-email', '', '31.02.2025', 'not-a-date', '2026-02-01'],
    ]);

    const result = await parser.parse(fileBuffer);

    expect(result.validRowCount).toBe(0);
    expect(result.invalidRowCount).toBe(1);

    expect(result.rows[0]).toEqual({
      rowNumber: 2,
      data: {
        name: '',
        phone: '',
        email: 'invalid-email',
        equipment: '',
        type: null,
        manufacturer: null,
        model: null,
        serialNumber: null,
        serviceIntervalMonths: null,
        notes: null,
        installationDate: null,
        lastServiceDate: null,
        nextServiceDate: '2026-02-01',
      },
      isValid: false,
      errors: [
        'Не указано имя клиента',
        'Не указан телефон клиента',
        'Не указано оборудование',
        'Email имеет неверный формат',
        'Дата установки имеет неверный формат',
        'Дата последнего обслуживания имеет неверный формат',
      ],
      warnings: [],
    });
  });

  it('keeps row valid when optional service dates are missing', async () => {
    const fileBuffer = await createWorkbookBuffer([
      ['ФИО', 'Телефон', 'Оборудование'],
      ['Анна Смирнова', '+375 29 987-65-43', 'Водонагреватель'],
    ]);

    const result = await parser.parse(fileBuffer);

    expect(result.validRowCount).toBe(1);
    expect(result.invalidRowCount).toBe(0);

    expect(result.rows[0]).toEqual({
      rowNumber: 2,
      data: {
        name: 'Анна Смирнова',
        phone: '+375299876543',
        email: null,
        equipment: 'Водонагреватель',
        type: null,
        manufacturer: null,
        model: null,
        serialNumber: null,
        serviceIntervalMonths: null,
        notes: null,
        installationDate: null,
        lastServiceDate: null,
        nextServiceDate: null,
      },
      isValid: true,
      errors: [],
      warnings: [
        'Не указаны дата установки и дата последнего обслуживания',
        'Не назначена дата следующего обслуживания',
      ],
    });
  });

  it('throws BadRequestException when Excel file is corrupted', async () => {
    const corruptedFileBuffer = Buffer.from('this is not an xlsx file');

    const parsing = parser.parse(corruptedFileBuffer);

    await expect(parsing).rejects.toBeInstanceOf(BadRequestException);

    await expect(parsing).rejects.toThrow(
      'Не удалось прочитать Excel-файл. Проверьте, что файл не повреждён',
    );
  });
});
