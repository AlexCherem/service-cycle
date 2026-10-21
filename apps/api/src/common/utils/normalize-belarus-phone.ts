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
