import assert from 'node:assert/strict';
import test from 'node:test';

import { getEquipmentDateOrderError } from '../src/entities/equipment/model/getEquipmentDateOrderError.ts';
import { getEquipmentChanges } from '../src/features/EditEquipment/model/getEquipmentChanges.ts';

const equipment = {
  id: 'equipment-id',
  name: 'Котёл Vaillant',
  type: 'Газовый котёл',
  manufacturer: 'Vaillant',
  model: null,
  serialNumber: '00123',
  serviceIntervalMonths: 12,
  installationDate: '2022-09-15',
  lastServiceDate: '2025-09-15',
  nextServiceDate: '2026-09-15',
  notes: 'Доступ через администратора',
  client: { id: 'client-id', name: 'Иван' },
  status: 'OVERDUE',
};

test('unchanged form does not produce an update, including empty optional inputs', () => {
  assert.deepEqual(
    getEquipmentChanges({ ...equipment, model: '' }, equipment),
    {},
  );
});

test('partial form changes preserve omitted fields and do not mutate inputs', () => {
  const values = Object.freeze({ name: '  Основной котёл  ' });
  const original = structuredClone(equipment);
  assert.deepEqual(getEquipmentChanges(values, equipment), {
    name: 'Основной котёл',
  });
  assert.deepEqual(equipment, original);
  assert.deepEqual(getEquipmentChanges({}, equipment), {});
});

test('clearing optional text, number and dates explicitly sends null', () => {
  assert.deepEqual(
    getEquipmentChanges(
      {
        type: ' ',
        manufacturer: '',
        serialNumber: '',
        notes: null,
        serviceIntervalMonths: null,
        installationDate: '',
        lastServiceDate: null,
        nextServiceDate: '',
      },
      equipment,
    ),
    {
      type: null,
      manufacturer: null,
      serialNumber: null,
      notes: null,
      serviceIntervalMonths: null,
      installationDate: null,
      lastServiceDate: null,
      nextServiceDate: null,
    },
  );
});

test('serial numbers retain leading zeros and case; notes retain internal line breaks', () => {
  assert.deepEqual(
    getEquipmentChanges(
      { serialNumber: '  00AbC  ', notes: '  Первая строка\nВторая строка  ' },
      equipment,
    ),
    {
      serialNumber: '00AbC',
      notes: 'Первая строка\nВторая строка',
    },
  );
});

test('service updates keep date-only strings and send only changed values', () => {
  assert.deepEqual(
    getEquipmentChanges(
      { nextServiceDate: '2027-09-15', serviceIntervalMonths: 24 },
      equipment,
    ),
    {
      nextServiceDate: '2027-09-15',
      serviceIntervalMonths: 24,
    },
  );
});

test('an equipment update cannot reassign its owner or submit computed fields', () => {
  assert.deepEqual(
    getEquipmentChanges(
      { clientId: 'other-client', companyId: 'other-company', status: 'OK' },
      equipment,
    ),
    {},
  );
});

test('optional dates can be empty', () => {
  for (const field of [
    'installationDate',
    'lastServiceDate',
    'nextServiceDate',
  ]) {
    for (const value of ['', null, undefined])
      assert.equal(
        getEquipmentDateOrderError(field, { [field]: value }),
        undefined,
      );
  }
});

test('last service cannot precede installation, but equal dates are allowed', () => {
  assert.ok(
    getEquipmentDateOrderError('lastServiceDate', {
      installationDate: '2025-09-15',
      lastServiceDate: '2025-09-14',
    }),
  );
  assert.equal(
    getEquipmentDateOrderError('lastServiceDate', {
      installationDate: '2025-09-15',
      lastServiceDate: '2025-09-15',
    }),
    undefined,
  );
});

test('next service is compared with last service when present', () => {
  assert.ok(
    getEquipmentDateOrderError('nextServiceDate', {
      ...equipment,
      nextServiceDate: '2025-09-14',
    }),
  );
  assert.equal(
    getEquipmentDateOrderError('nextServiceDate', {
      ...equipment,
      nextServiceDate: '2025-09-15',
    }),
    undefined,
  );
});

test('without last service, next service is compared with installation', () => {
  assert.ok(
    getEquipmentDateOrderError('nextServiceDate', {
      installationDate: '2025-09-15',
      lastServiceDate: '',
      nextServiceDate: '2025-09-14',
    }),
  );
  assert.equal(
    getEquipmentDateOrderError('nextServiceDate', {
      installationDate: null,
      lastServiceDate: null,
      nextServiceDate: '2025-09-14',
    }),
    undefined,
  );
});
