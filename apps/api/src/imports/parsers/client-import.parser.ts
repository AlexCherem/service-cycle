import { BadRequestException, Injectable } from '@nestjs/common';
import ExcelJS from 'exceljs';

import { normalizeBelarusPhone, parseExcelDate } from './import-value.parsers';

const readCellText = (cell: ExcelJS.Cell): string => {
  const text: unknown = cell.text;

  if (typeof text === 'string') {
    return text.trim();
  }

  if (
    typeof text === 'object' &&
    text !== null &&
    'richText' in text &&
    Array.isArray(text.richText)
  ) {
    return text.richText
      .map((part: unknown) => {
        if (
          typeof part === 'object' &&
          part !== null &&
          'text' in part &&
          typeof part.text === 'string'
        ) {
          return part.text;
        }

        return '';
      })
      .join('')
      .trim();
  }

  return '';
};

@Injectable()
export class ClientImportParser {
  async parse(fileBuffer: Buffer) {
    const workbook = new ExcelJS.Workbook();
    const excelBuffer = Uint8Array.from(fileBuffer).buffer;

    try {
      await workbook.xlsx.load(excelBuffer);
    } catch {
      throw new BadRequestException(
        'Не удалось прочитать Excel-файл. Проверьте, что файл не повреждён',
      );
    }

    const worksheet = workbook.worksheets[0];

    if (!worksheet) {
      throw new BadRequestException('В Excel-файле не найден рабочий лист');
    }

    if (worksheet.actualRowCount === 0) {
      throw new BadRequestException('В Excel-файле отсутствуют строки');
    }

    const headerRow = worksheet.getRow(1);

    const headers = Array.from(
      { length: worksheet.actualColumnCount },
      (_, index) => readCellText(headerRow.getCell(index + 1)),
    );

    const normalizedHeaders = headers.map((header) =>
      header
        .toLowerCase()
        .replace(/[.-]/g, '')
        .replace(/[_\s]+/g, ' ')
        .trim(),
    );

    const findHeader = (aliases: string[]) => {
      const headerIndex = normalizedHeaders.findIndex((header) =>
        aliases.includes(header),
      );

      return headerIndex === -1 ? null : headers[headerIndex];
    };

    const detectedColumns = {
      name: findHeader([
        'фио',
        'имя',
        'имя клиента',
        'клиент',
        'фамилия имя отчество',
      ]),
      phone: findHeader([
        'телефон',
        'номер телефона',
        'мобильный',
        'мобильный телефон',
        'тел',
      ]),
      email: findHeader(['email', 'электронная почта', 'почта']),
      equipment: findHeader([
        'оборудование',
        'наименование оборудования',
        'название оборудования',
        'техника',
        'устройство',
        'аппарат',
      ]),
      type: findHeader([
        'тип оборудования',
        'тип техники',
        'категория оборудования',
      ]),
      manufacturer: findHeader(['производитель', 'бренд', 'марка']),
      model: findHeader(['модель', 'модель оборудования']),
      serialNumber: findHeader([
        'серийный номер',
        'серийный номер оборудования',
        'заводской номер',
      ]),
      serviceIntervalMonths: findHeader([
        'интервал обслуживания (мес)',
        'интервал обслуживания месяцев',
        'периодичность обслуживания',
      ]),
      notes: findHeader([
        'примечание к оборудованию',
        'примечание',
        'комментарий',
        'заметка',
      ]),
      installationDate: findHeader([
        'дата установки',
        'дата монтажа',
        'установлено',
      ]),
      lastServiceDate: findHeader([
        'дата последнего обслуживания',
        'дата предыдущего обслуживания',
        'последнее обслуживание',
      ]),
      nextServiceDate: findHeader([
        'дата следующего обслуживания',
        'следующее обслуживание',
        'плановая дата обслуживания',
        'назначенная дата обслуживания',
      ]),
    };

    const nameHeader = detectedColumns.name;
    const phoneHeader = detectedColumns.phone;
    const emailHeader = detectedColumns.email;
    const equipmentHeader = detectedColumns.equipment;

    if (!nameHeader || !phoneHeader || !equipmentHeader) {
      const missingRequiredColumns: string[] = [];

      if (!nameHeader) {
        missingRequiredColumns.push('ФИО');
      }

      if (!phoneHeader) {
        missingRequiredColumns.push('Телефон');
      }

      if (!equipmentHeader) {
        missingRequiredColumns.push('Оборудование');
      }

      throw new BadRequestException(
        `Не найдены обязательные колонки: ${missingRequiredColumns.join(', ')}`,
      );
    }

    const nameColumnNumber = headers.indexOf(nameHeader) + 1;
    const phoneColumnNumber = headers.indexOf(phoneHeader) + 1;
    const equipmentColumnNumber = headers.indexOf(equipmentHeader) + 1;
    const typeColumnNumber = detectedColumns.type
      ? headers.indexOf(detectedColumns.type) + 1
      : null;
    const manufacturerColumnNumber = detectedColumns.manufacturer
      ? headers.indexOf(detectedColumns.manufacturer) + 1
      : null;
    const modelColumnNumber = detectedColumns.model
      ? headers.indexOf(detectedColumns.model) + 1
      : null;
    const serialNumberColumnNumber = detectedColumns.serialNumber
      ? headers.indexOf(detectedColumns.serialNumber) + 1
      : null;
    const serviceIntervalMonthsColumnNumber =
      detectedColumns.serviceIntervalMonths
        ? headers.indexOf(detectedColumns.serviceIntervalMonths) + 1
        : null;
    const notesColumnNumber = detectedColumns.notes
      ? headers.indexOf(detectedColumns.notes) + 1
      : null;
    const installationDateColumnNumber = detectedColumns.installationDate
      ? headers.indexOf(detectedColumns.installationDate) + 1
      : null;
    const lastServiceDateColumnNumber = detectedColumns.lastServiceDate
      ? headers.indexOf(detectedColumns.lastServiceDate) + 1
      : null;
    const nextServiceDateColumnNumber = detectedColumns.nextServiceDate
      ? headers.indexOf(detectedColumns.nextServiceDate) + 1
      : null;
    const emailColumnNumber = emailHeader
      ? headers.indexOf(emailHeader) + 1
      : null;

    const dataRowCount = worksheet.actualRowCount - 1;

    const rows = Array.from({ length: dataRowCount }, (_, rowIndex) => {
      const rowNumber = rowIndex + 2;
      const row = worksheet.getRow(rowNumber);

      const name = readCellText(row.getCell(nameColumnNumber));
      const phone = readCellText(row.getCell(phoneColumnNumber));
      const equipment = readCellText(row.getCell(equipmentColumnNumber));
      const type = typeColumnNumber
        ? readCellText(row.getCell(typeColumnNumber))
        : '';
      const manufacturer = manufacturerColumnNumber
        ? readCellText(row.getCell(manufacturerColumnNumber))
        : '';
      const model = modelColumnNumber
        ? readCellText(row.getCell(modelColumnNumber))
        : '';
      const serialNumber = serialNumberColumnNumber
        ? readCellText(row.getCell(serialNumberColumnNumber))
        : '';
      const notes = notesColumnNumber
        ? readCellText(row.getCell(notesColumnNumber))
        : '';

      const serviceIntervalText = serviceIntervalMonthsColumnNumber
        ? readCellText(row.getCell(serviceIntervalMonthsColumnNumber))
        : '';

      const parsedServiceIntervalMonths = Number(serviceIntervalText);

      const isServiceIntervalInvalid =
        serviceIntervalText !== '' &&
        (!Number.isInteger(parsedServiceIntervalMonths) ||
          parsedServiceIntervalMonths <= 0);

      const serviceIntervalMonths =
        serviceIntervalText !== '' && !isServiceIntervalInvalid
          ? parsedServiceIntervalMonths
          : null;
      const normalizedPhone = normalizeBelarusPhone(phone);
      const email = emailColumnNumber
        ? readCellText(row.getCell(emailColumnNumber))
        : '';
      const installationDate = parseExcelDate(
        installationDateColumnNumber
          ? row.getCell(installationDateColumnNumber)
          : null,
      );
      const lastServiceDate = parseExcelDate(
        lastServiceDateColumnNumber
          ? row.getCell(lastServiceDateColumnNumber)
          : null,
      );
      const nextServiceDate = parseExcelDate(
        nextServiceDateColumnNumber
          ? row.getCell(nextServiceDateColumnNumber)
          : null,
      );

      const errors: string[] = [];
      const warnings: string[] = [];

      if (!name) {
        errors.push('Не указано имя клиента');
      }

      if (!phone) {
        errors.push('Не указан телефон клиента');
      } else if (!normalizedPhone) {
        errors.push('Телефон имеет неверный формат');
      }

      if (!equipment) {
        errors.push('Не указано оборудование');
      }

      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.push('Email имеет неверный формат');
      }

      if (isServiceIntervalInvalid) {
        errors.push('Интервал обслуживания должен быть целым числом больше 0');
      }

      if (installationDate.isInvalid) {
        errors.push('Дата установки имеет неверный формат');
      }

      if (lastServiceDate.isInvalid) {
        errors.push('Дата последнего обслуживания имеет неверный формат');
      }

      if (nextServiceDate.isInvalid) {
        errors.push('Дата следующего обслуживания имеет неверный формат');
      }

      if (
        installationDate.value &&
        lastServiceDate.value &&
        lastServiceDate.value < installationDate.value
      ) {
        errors.push(
          'Дата последнего обслуживания не может быть раньше даты установки',
        );
      }

      const serviceReferenceDate =
        lastServiceDate.value ?? installationDate.value;

      if (
        serviceReferenceDate &&
        nextServiceDate.value &&
        nextServiceDate.value < serviceReferenceDate
      ) {
        errors.push(
          'Дата следующего обслуживания не может быть раньше предыдущей даты',
        );
      }

      if (
        !installationDate.isInvalid &&
        !lastServiceDate.isInvalid &&
        !installationDate.value &&
        !lastServiceDate.value
      ) {
        warnings.push(
          'Не указаны дата установки и дата последнего обслуживания',
        );
      }

      if (!nextServiceDate.isInvalid && !nextServiceDate.value) {
        warnings.push('Не назначена дата следующего обслуживания');
      }

      return {
        rowNumber,
        data: {
          name,
          phone: normalizedPhone ?? phone,
          email: email || null,
          equipment,
          type: type || null,
          manufacturer: manufacturer || null,
          model: model || null,
          serialNumber: serialNumber || null,
          serviceIntervalMonths,
          notes: notes || null,
          installationDate: installationDate.value,
          lastServiceDate: lastServiceDate.value,
          nextServiceDate: nextServiceDate.value,
        },
        isValid: errors.length === 0,
        errors,
        warnings,
      };
    });

    const validRowCount = rows.filter((row) => row.isValid).length;
    const invalidRowCount = rows.length - validRowCount;

    return {
      worksheetName: worksheet.name,
      rowCount: worksheet.actualRowCount,
      columnCount: worksheet.actualColumnCount,
      headers,
      detectedColumns,
      validRowCount,
      invalidRowCount,
      rows,
    };
  }
}

export type ClientImportRow = Awaited<
  ReturnType<ClientImportParser['parse']>
>['rows'][number];
