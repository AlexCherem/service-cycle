import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import test from 'node:test';

import { toDatePickerValue } from '../src/shared/lib/date/toDatePickerValue.ts';

test('empty and invalid API dates never become today or a corrected calendar date', () => {
  for (const value of [
    undefined,
    null,
    '',
    '2023-02-29',
    '2024-02-30',
    '2025-13-01',
    '2025-9-15',
    '15.09.2025',
    '2025-09-15T00:00:00Z',
  ]) {
    assert.equal(toDatePickerValue(value), undefined, String(value));
  }
  assert.equal(
    toDatePickerValue('2024-02-29').format('DD.MM.YYYY'),
    '29.02.2024',
  );
});

test('date-only values round-trip without a day shift in different time zones', () => {
  const helperUrl = new URL(
    '../src/shared/lib/date/toDatePickerValue.ts',
    import.meta.url,
  ).href;
  for (const timezone of [
    'UTC',
    'Europe/Minsk',
    'America/Los_Angeles',
    'Pacific/Kiritimati',
  ]) {
    const output = execFileSync(
      process.execPath,
      [
        '--experimental-default-type=module',
        '--experimental-strip-types',
        '--input-type=module',
        '-e',
        `import { toDatePickerValue } from ${JSON.stringify(helperUrl)};
       console.log(['2024-02-29', '2026-01-01', '2026-12-31'].map(value => toDatePickerValue(value).format('YYYY-MM-DD')).join(','));`,
      ],
      { env: { ...process.env, TZ: timezone }, encoding: 'utf8' },
    );
    assert.equal(output.trim(), '2024-02-29,2026-01-01,2026-12-31', timezone);
  }
});
