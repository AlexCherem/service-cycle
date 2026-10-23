import assert from 'node:assert/strict';
import test from 'node:test';

import { calculateNextServiceDate } from '../src/entities/equipment/model/calculateNextServiceDate.ts';

test('calculation uses last service before installation', () => {
  assert.equal(
    calculateNextServiceDate({
      installationDate: '2022-09-15',
      lastServiceDate: '2025-09-15',
      serviceIntervalMonths: 12,
    }),
    '2026-09-15',
  );
});

test('without last service, calculation starts from installation', () => {
  for (const lastServiceDate of [undefined, null, '']) {
    assert.equal(
      calculateNextServiceDate({
        installationDate: '2025-09-15',
        lastServiceDate,
        serviceIntervalMonths: 6,
      }),
      '2026-03-15',
    );
  }
});

test('calendar months clamp to the last valid day of the destination month', () => {
  for (const [lastServiceDate, serviceIntervalMonths, expected] of [
    ['2025-01-31', 1, '2025-02-28'],
    ['2024-01-31', 1, '2024-02-29'],
    ['2024-02-29', 12, '2025-02-28'],
    ['2025-01-31', 2, '2025-03-31'],
    ['2025-12-31', 1, '2026-01-31'],
  ]) {
    assert.equal(
      calculateNextServiceDate({ lastServiceDate, serviceIntervalMonths }),
      expected,
    );
  }
});

test('missing dates or an invalid interval do not produce a calculation', () => {
  assert.equal(
    calculateNextServiceDate({ serviceIntervalMonths: 12 }),
    undefined,
  );
  for (const serviceIntervalMonths of [
    undefined,
    null,
    0,
    -1,
    1.5,
    NaN,
    Infinity,
    2147483648,
  ]) {
    assert.equal(
      calculateNextServiceDate({
        lastServiceDate: '2025-09-15',
        serviceIntervalMonths,
      }),
      undefined,
    );
  }
});

test('invalid reference dates and results outside the API date format are rejected', () => {
  for (const lastServiceDate of ['invalid', '2025-02-30', '2025-9-15']) {
    assert.equal(
      calculateNextServiceDate({ lastServiceDate, serviceIntervalMonths: 12 }),
      undefined,
    );
  }
  assert.equal(
    calculateNextServiceDate({
      lastServiceDate: '9999-12-31',
      serviceIntervalMonths: 1,
    }),
    undefined,
  );
  assert.equal(
    calculateNextServiceDate({
      lastServiceDate: '2025-01-01',
      serviceIntervalMonths: 2147483647,
    }),
    undefined,
  );
});

test('calculation does not mutate schedule inputs', () => {
  const schedule = Object.freeze({
    lastServiceDate: '2025-01-31',
    serviceIntervalMonths: 1,
  });
  assert.equal(calculateNextServiceDate(schedule), '2025-02-28');
  assert.equal(schedule.lastServiceDate, '2025-01-31');
});
