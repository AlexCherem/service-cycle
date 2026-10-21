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

  it('leaves omitted fields undefined and preserves explicit null', async () => {
    const omitted = await validate({});

    expect(omitted.name).toBeUndefined();
    expect(omitted.email).toBeUndefined();
    expect(omitted.phone).toBeUndefined();

    const cleared = await validate({ email: null, phone: null });

    expect(cleared.email).toBeNull();
    expect(cleared.phone).toBeNull();
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
    { companyId: 'another-company' },
    { id: 'another-client' },
    { equipment: [] },
  ])('rejects invalid or forbidden fields: %j', async (body) => {
    await expect(validate(body)).rejects.toThrow(BadRequestException);
  });
});
