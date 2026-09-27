import { BadRequestException, ValidationPipe } from '@nestjs/common';

import { UpdateEquipmentDto } from './update-equipment.dto';

describe('UpdateEquipmentDto', () => {
  const pipe = new ValidationPipe({
    forbidNonWhitelisted: true,
    transform: true,
    whitelist: true,
  });

  const validate = (body: Record<string, unknown>) =>
    pipe.transform(body, {
      type: 'body',
      metatype: UpdateEquipmentDto,
    }) as Promise<UpdateEquipmentDto>;

  it('trims name and leaves omitted fields undefined', async () => {
    const result = await validate({ name: '  Газовый котёл  ' });

    expect(result.name).toBe('Газовый котёл');
    expect(result.notes).toBeUndefined();
    expect(result.nextServiceDate).toBeUndefined();
  });

  it('preserves null for fields that can be cleared', async () => {
    const body = {
      type: null,
      manufacturer: null,
      model: null,
      serialNumber: null,
      serviceIntervalMonths: null,
      installationDate: null,
      lastServiceDate: null,
      nextServiceDate: null,
      notes: null,
    };

    const result = await validate(body);

    expect(result).toMatchObject(body);
    expect(result.name).toBeUndefined();
  });

  it('accepts technical fields and valid calendar dates', async () => {
    const body = {
      type: 'Газовый котёл',
      manufacturer: 'Vaillant',
      model: 'ecoTEC plus',
      serialNumber: '0012345678',
      serviceIntervalMonths: 12,
      installationDate: '2022-09-15',
      lastServiceDate: '2026-09-27',
      nextServiceDate: '2028-02-29',
      notes: 'Доступ через администратора',
    };

    await expect(validate(body)).resolves.toMatchObject(body);
  });

  it.each([
    { name: null },
    { name: '' },
    { name: '   ' },
    { serialNumber: 12345 },
    { serviceIntervalMonths: 0 },
    { serviceIntervalMonths: -1 },
    { serviceIntervalMonths: 1.5 },
    { serviceIntervalMonths: '12' },
    { serviceIntervalMonths: 2147483648 },
    { installationDate: '2026-02-30' },
    { lastServiceDate: '2026-02-29' },
    { nextServiceDate: '2026-09-15T00:00:00Z' },
    { nextServiceDate: '15.09.2026' },
    { nextServiceDate: '' },
    { companyId: '7cfad2ad-8c32-4614-bd68-4882d7998655' },
    { clientId: '8810c8d6-67ee-49bd-82c8-4cd4865e9ac5' },
    { status: 'OK' },
    { id: '960ae682-3486-4fd5-8709-76b650582f84' },
  ])('rejects invalid or forbidden fields: %j', async (body) => {
    await expect(validate(body)).rejects.toThrow(BadRequestException);
  });
});
