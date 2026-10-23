export function positiveInteger(
  value: string | null,
  fallback: number,
): number {
  if (!value || !/^\d+$/.test(value)) return fallback;
  const number = Number(value);
  return Number.isSafeInteger(number) && number > 0 ? number : fallback;
}
