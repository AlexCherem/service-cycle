'use client';

import type { FormItemProps } from 'antd';
import { Form, Input } from 'antd';
import type { TextAreaProps } from 'antd/es/input';

export type FormTextAreaProps<Values> = Pick<
  FormItemProps<Values>,
  'name' | 'label' | 'rules' | 'extra' | 'dependencies'
> & {
  textAreaProps?: Omit<TextAreaProps, 'value' | 'defaultValue'>;
};

export function FormTextArea<Values>({
  textAreaProps,
  ...formItemProps
}: FormTextAreaProps<Values>) {
  return (
    <Form.Item<Values> {...formItemProps}>
      <Input.TextArea {...textAreaProps} />
    </Form.Item>
  );
}
