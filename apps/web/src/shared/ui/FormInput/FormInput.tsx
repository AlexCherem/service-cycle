'use client';

import type { FormItemProps, InputProps } from 'antd';
import { Form, Input } from 'antd';

export type FormInputProps<Values> = Pick<
  FormItemProps<Values>,
  'name' | 'label' | 'rules' | 'extra' | 'dependencies'
> & {
  inputProps?: Omit<InputProps, 'value' | 'defaultValue'>;
};

export function FormInput<Values>({
  inputProps,
  ...formItemProps
}: FormInputProps<Values>) {
  return (
    <Form.Item<Values> {...formItemProps}>
      <Input {...inputProps} />
    </Form.Item>
  );
}
