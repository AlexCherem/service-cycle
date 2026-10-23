import type { ReactNode } from 'react';

import type { FormInstance, FormProps } from 'antd';
import { Form } from 'antd';

import type { UpdateClientDto } from '@/shared/api/generated/models';
import { FormInput } from '@/shared/ui/FormInput';
import { FormTextArea } from '@/shared/ui/FormTextArea';

export type ClientFormProps<Values extends UpdateClientDto = UpdateClientDto> =
  Pick<
    FormProps<Values>,
    'name' | 'disabled' | 'onFinish' | 'onValuesChange'
  > & {
    form: FormInstance<Values>;
    children?: ReactNode;
  };

export function ClientForm<Values extends UpdateClientDto = UpdateClientDto>({
  children,
  ...formProps
}: ClientFormProps<Values>) {
  return (
    <Form<Values> {...formProps} layout="vertical" requiredMark={false}>
      {children}
      <FormInput<UpdateClientDto>
        name="name"
        label="Имя клиента"
        rules={[
          { required: true, whitespace: true, message: 'Введите имя клиента' },
        ]}
        inputProps={{ autoComplete: 'name' }}
      />
      <FormInput<UpdateClientDto>
        name="phone"
        label="Телефон"
        rules={[
          {
            required: true,
            whitespace: true,
            message: 'Введите телефон клиента',
          },
        ]}
        inputProps={{
          type: 'tel',
          autoComplete: 'tel',
          placeholder: '+375 29 123-45-67',
          allowClear: true,
        }}
      />
      <FormInput<UpdateClientDto>
        name="email"
        label="Email"
        rules={[
          {
            type: 'email',
            transform: (value: string | null | undefined) =>
              value?.trim() || undefined,
            message: 'Введите корректный email',
          },
          { max: 254, message: 'Email не должен превышать 254 символа' },
        ]}
        inputProps={{ autoComplete: 'email', allowClear: true }}
      />
      <FormTextArea<UpdateClientDto>
        name="notes"
        label="Примечание"
        rules={[
          { max: 300, message: 'Примечание не должно превышать 300 символов' },
        ]}
        textAreaProps={{
          placeholder: 'Например, перед визитом позвонить за час',
          maxLength: 300,
          showCount: true,
          autoSize: { minRows: 3, maxRows: 6 },
        }}
      />
    </Form>
  );
}
