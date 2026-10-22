import { BadRequestException, ValidationPipe } from '@nestjs/common';

import { UpdateClientDto } from './update-client.dto';

describe('UpdateClientDto', () => {
  const pipe = new ValidationPipe({
    forbidNonWhitelisted: true,
    transform: true,
    whitelist: true,
  });

  const validate = (body: Record<string, unknown>) =>
    pipe.transform(body, {
      type: 'body',
      metatype: UpdateClientDto,
    }) as Promise<UpdateClientDto>;

  it('normalizes client data', async () => {
    const result = await validate({
      name: '  Иван Иванов  ',
      email: ' Ivan@Example.com ',
      phone: '8 029 123-45-67',
    });

    expect(result).toMatchObject({
      name: 'Иван Иванов',
      email: 'ivan@example.com',
      phone: '+375291234567',
    });
  });

  it('leaves omitted fields undefined and allows clearing email', async () => {
    const omitted = await validate({});

    expect(omitted.name).toBeUndefined();
    expect(omitted.email).toBeUndefined();
    expect(omitted.phone).toBeUndefined();
    expect(omitted.notes).toBeUndefined();

    const cleared = await validate({ email: null });

    expect(cleared.email).toBeNull();
    expect(cleared.phone).toBeUndefined();
  });

  it('allows clearing notes with null', async () => {
    expect((await validate({ notes: null })).notes).toBeNull();
  });

  it('trims notes while preserving line breaks and letter case', async () => {
    const result = await validate({
      notes: '  Перед визитом позвонить.\nКод: AbC-123.  ',
    });

    expect(result.notes).toBe('Перед визитом позвонить.\nКод: AbC-123.');
  });

  it.each(['', '   '])(
    'allows empty notes after trimming: %j',
    async (notes) => {
      expect((await validate({ notes })).notes).toBe('');
    },
  );

  it('accepts 300 characters after trimming', async () => {
    const notes = 'а'.repeat(300);

    expect((await validate({ notes: `  ${notes}  ` })).notes).toBe(notes);
  });

  it.each([
    { name: null },
    { name: '' },
    { name: 123 },
    { name: '   ' },
    { email: 'incorrect-email' },
    { email: '' },
    { email: '   ' },
    { email: 123 },
    { email: `${'a'.repeat(243)}@example.com` },
    { phone: '123' },
    { phone: '' },
    { phone: '   ' },
    { phone: {} },
    { phone: 375291234567 },
    { phone: null },
    { notes: 'а'.repeat(301) },
    { notes: 123 },
    { notes: {} },
    { notes: [] },
    { notes: false },
    { companyId: 'another-company' },
    { id: 'another-client' },
    { equipment: [] },
  ])('rejects invalid or forbidden fields: %j', async (body) => {
    await expect(validate(body)).rejects.toThrow(BadRequestException);
  });
});
