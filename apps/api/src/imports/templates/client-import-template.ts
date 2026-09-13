import ExcelJS from 'exceljs';

const CLIENT_IMPORT_TEMPLATE_COLUMNS = [
  {
    header: 'Клиент',
    key: 'client',
    width: 28,
  },
  {
    header: 'Телефон',
    key: 'phone',
    width: 20,
  },
  {
    header: 'Email',
    key: 'email',
    width: 28,
  },
  {
    header: 'Оборудование',
    key: 'equipment',
    width: 30,
  },
  {
    header: 'Тип оборудования',
    key: 'equipmentType',
    width: 24,
  },
  {
    header: 'Производитель',
    key: 'manufacturer',
    width: 20,
  },
  {
    header: 'Модель',
    key: 'model',
    width: 20,
  },
  {
    header: 'Серийный номер',
    key: 'serialNumber',
    width: 22,
  },
  {
    header: 'Дата установки',
    key: 'installationDate',
    width: 20,
  },
  {
    header: 'Интервал обслуживания (мес.)',
    key: 'serviceIntervalMonths',
    width: 30,
  },
  {
    header: 'Дата последнего обслуживания',
    key: 'lastServiceDate',
    width: 30,
  },
  {
    header: 'Дата следующего обслуживания',
    key: 'nextServiceDate',
    width: 30,
  },
  {
    header: 'Примечание к оборудованию',
    key: 'notes',
    width: 36,
  },
];

export const createClientImportTemplate = async (): Promise<Buffer> => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Клиенты', {
    views: [
      {
        state: 'frozen',
        ySplit: 1,
      },
    ],
  });

  worksheet.columns = CLIENT_IMPORT_TEMPLATE_COLUMNS;
  worksheet.autoFilter = 'A1:M1';

  const headerRow = worksheet.getRow(1);

  headerRow.height = 32;
  headerRow.font = {
    bold: true,
    color: {
      argb: 'FFFFFFFF',
    },
  };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: {
      argb: 'FF1677FF',
    },
  };
  headerRow.alignment = {
    horizontal: 'center',
    vertical: 'middle',
    wrapText: true,
  };

  worksheet.getColumn('phone').numFmt = '@';
  worksheet.getColumn('serialNumber').numFmt = '@';
  worksheet.getColumn('installationDate').numFmt = 'dd.mm.yyyy';
  worksheet.getColumn('lastServiceDate').numFmt = 'dd.mm.yyyy';
  worksheet.getColumn('nextServiceDate').numFmt = 'dd.mm.yyyy';
  worksheet.getColumn('serviceIntervalMonths').numFmt = '0';

  const excelBuffer = await workbook.xlsx.writeBuffer();

  return Buffer.from(excelBuffer);
};
