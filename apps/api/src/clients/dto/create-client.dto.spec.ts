import { BadRequestException, ValidationPipe } from '@nestjs/common';

import { CreateClientDto } from './create-client.dto';

describe('CreateClientDto', () => {
  const pipe = new ValidationPipe({
    forbidNonWhitelisted: true,
    transform: true,
    whitelist: true,
  });
  const valid = { name: 'Иван Иванов', phone: '+375291234567' };

  const validate = (body: Record<string, unknown>) =>
    pipe.transform(body, {
      type: 'body',
      metatype: CreateClientDto,
    }) as Promise<CreateClientDto>;

  it('accepts only name and phone with optional fields omitted', async () => {
    const result = await validate(valid);

    expect(result).toMatchObject(valid);
    expect(result.email).toBeUndefined();
    expect(result.notes).toBeUndefined();
  });

  it('normalizes all client fields and preserves note formatting', async () => {
    const result = await validate({
      name: '  Иван Иванов  ',
      phone: '8 029 123-45-67',
      email: '  IVAN@Example.com  ',
      notes: '  Позвонить заранее.\nКод: AbC.  ',
    });

    expect(result).toMatchObject({
      ...valid,
      email: 'ivan@example.com',
      notes: 'Позвонить заранее.\nКод: AbC.',
    });
  });

  it('accepts null email and notes', async () => {
    const result = await validate({ ...valid, email: null, notes: null });

    expect(result.email).toBeNull();
    expect(result.notes).toBeNull();
  });

  it('accepts email and notes at their length limits', async () => {
    const email = `${'a'.repeat(64)}@${'b'.repeat(63)}.${'c'.repeat(63)}.${'d'.repeat(61)}`;
    const notes = 'а'.repeat(300);
    const result = await validate({ ...valid, email, notes: `  ${notes}  ` });

    expect(result.email).toHaveLength(254);
    expect(result.notes).toBe(notes);
  });

  it.each([
    { name: undefined },
    { name: null },
    { name: '' },
    { name: '   ' },
    { name: 123 },
    { phone: undefined },
    { phone: null },
    { phone: '' },
    { phone: '   ' },
    { phone: '123' },
    { phone: 375291234567 },
    { email: 'incorrect-email' },
    { email: '' },
    { email: '   ' },
    { email: 123 },
    { email: `${'a'.repeat(243)}@example.com` },
    { notes: 'а'.repeat(301) },
    { notes: 123 },
    { notes: {} },
    { notes: [] },
    { companyId: 'another-company' },
    { id: 'client-id' },
    { equipment: [] },
  ])('rejects invalid or forbidden input: %j', async (overrides) => {
    await expect(validate({ ...valid, ...overrides })).rejects.toThrow(
      BadRequestException,
    );
  });
});
