import type { Cell } from 'exceljs';

export type ParsedExcelDate = {
  value: string | null;
  isInvalid: boolean;
};

export const normalizeBelarusPhone = (phone: string): string | null => {
  const digits = phone.replace(/\D/g, '');

  if (/^375\d{9}$/.test(digits)) {
    return `+${digits}`;
  }

  if (/^80\d{9}$/.test(digits)) {
    return `+375${digits.slice(2)}`;
  }

  if (/^\d{9}$/.test(digits)) {
    return `+375${digits}`;
  }

  return null;
};

const createIsoDate = (
  year: number,
  month: number,
  day: number,
): string | null => {
  if (year < 1900 || year > 2100) {
    return null;
  }

  const date = new Date(Date.UTC(year, month - 1, day));

  const isValidDate =
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day;

  if (!isValidDate) {
    return null;
  }

  const formattedMonth = String(month).padStart(2, '0');
  const formattedDay = String(day).padStart(2, '0');

  return `${year}-${formattedMonth}-${formattedDay}`;
};

export const parseExcelDate = (cell: Cell | null): ParsedExcelDate => {
  if (!cell || !cell.text.trim()) {
    return {
      value: null,
      isInvalid: false,
    };
  }

  if (cell.value instanceof Date) {
    const value = createIsoDate(
      cell.value.getUTCFullYear(),
      cell.value.getUTCMonth() + 1,
      cell.value.getUTCDate(),
    );

    return {
      value,
      isInvalid: value === null,
    };
  }

  const text = cell.text.replace(/\s+/g, '');

  const isoMatch = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);

  if (isoMatch) {
    const value = createIsoDate(
      Number(isoMatch[1]),
      Number(isoMatch[2]),
      Number(isoMatch[3]),
    );

    return {
      value,
      isInvalid: value === null,
    };
  }

  const localMatch = text.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})\.?$/);

  if (localMatch) {
    const value = createIsoDate(
      Number(localMatch[3]),
      Number(localMatch[2]),
      Number(localMatch[1]),
    );

    return {
      value,
      isInvalid: value === null,
    };
  }

  return {
    value: null,
    isInvalid: true,
  };
};
