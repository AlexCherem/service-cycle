/** Formats an API date (YYYY-MM-DD) without timezone conversion. */
export function dateLabel(
  value: string | null | undefined,
  emptyLabel = 'Не указана',
): string {
  return value ? value.slice(0, 10).split('-').reverse().join('.') : emptyLabel;
}
