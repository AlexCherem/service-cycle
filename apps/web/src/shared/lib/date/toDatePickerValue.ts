import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';

export function toDatePickerValue(
  value: string | null | undefined,
): Dayjs | undefined {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  const date = dayjs(value);
  return date.isValid() && date.format('YYYY-MM-DD') === value
    ? date
    : undefined;
}
