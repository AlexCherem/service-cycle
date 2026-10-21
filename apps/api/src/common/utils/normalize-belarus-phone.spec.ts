import { normalizeBelarusPhone } from './normalize-belarus-phone';

describe('normalizeBelarusPhone', () => {
  it.each([
    '+375291234567',
    '+375 (29) 123-45-67',
    '375291234567',
    '8 029 123-45-67',
    '29 123-45-67',
  ])('normalizes %s to the same client key', (phone) => {
    expect(normalizeBelarusPhone(phone)).toBe('+375291234567');
  });

  it.each(['', '   ', '123', '+3752912345678', '+48221234567'])(
    'rejects an unsupported number: %j',
    (phone) => {
      expect(normalizeBelarusPhone(phone)).toBeNull();
    },
  );
});
