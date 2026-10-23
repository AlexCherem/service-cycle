'use client';

import type { ReactNode } from 'react';

import type { DatePickerProps, FormItemProps } from 'antd';
import { DatePicker, Form, Space } from 'antd';
import ruRU from 'antd/es/date-picker/locale/ru_RU';
import type { Dayjs } from 'dayjs';

import { toDatePickerValue } from '@/shared/lib/date/toDatePickerValue';

import 'dayjs/locale/ru';

export type FormDatePickerProps<Values> = Pick<
  FormItemProps<Values>,
  'name' | 'label' | 'rules' | 'extra' | 'dependencies'
> & {
  action?: ReactNode;
  minDate?: string | null;
  maxDate?: string | null;
  datePickerProps?: Omit<
    DatePickerProps,
    | 'value'
    | 'defaultValue'
    | 'onChange'
    | 'multiple'
    | 'picker'
    | 'showTime'
    | 'minDate'
    | 'maxDate'
  >;
};

function DatePickerControl({
  action,
  style,
  ...props
}: DatePickerProps & { action?: ReactNode }) {
  const picker = <DatePicker {...props} style={{ width: '100%', ...style }} />;
  return action ? (
    <Space.Compact block>
      {picker}
      {action}
    </Space.Compact>
  ) : (
    picker
  );
}

export function FormDatePicker<Values>({
  action,
  minDate,
  maxDate,
  datePickerProps,
  ...formItemProps
}: FormDatePickerProps<Values>) {
  const minimum = toDatePickerValue(minDate);
  const maximum = toDatePickerValue(maxDate);

  return (
    <Form.Item<Values>
      {...formItemProps}
      getValueProps={(value: string | null | undefined) => ({
        value: toDatePickerValue(value) ?? null,
      })}
      getValueFromEvent={(date: Dayjs | null) =>
        date?.format('YYYY-MM-DD') ?? null
      }
    >
      <DatePickerControl
        action={action}
        format="DD.MM.YYYY"
        placeholder="ДД.ММ.ГГГГ"
        locale={ruRU}
        allowClear
        style={{ width: '100%' }}
        {...datePickerProps}
        disabledDate={(date, info) =>
          Boolean(
            (minimum && date.isBefore(minimum, 'day')) ||
            (maximum && date.isAfter(maximum, 'day')) ||
            datePickerProps?.disabledDate?.(date, info),
          )
        }
      />
    </Form.Item>
  );
}
