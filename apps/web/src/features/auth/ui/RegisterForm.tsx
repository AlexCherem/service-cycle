'use client';

import { Button, Checkbox, Form, Input } from 'antd';

import type { RegisterDto } from '@/shared/api/generated/models';

import styles from './RegisterForm.module.css';

type RegisterFormValues = RegisterDto & {
  confirmPassword: string;
  acceptedTerms: boolean;
};

export function RegisterForm() {
  const [form] = Form.useForm<RegisterFormValues>();
  const acceptedTerms = Form.useWatch('acceptedTerms', form);

  return (
    <Form<RegisterFormValues>
      className={styles.form}
      form={form}
      layout="vertical"
      name="register"
      requiredMark={false}
      scrollToFirstError
    >
      <Form.Item<RegisterFormValues>
        label="Название компании"
        name="companyName"
        rules={[
          { required: true, message: 'Введите название компании' },
          {
            min: 2,
            message: 'Название компании должно содержать минимум 2 символа',
          },
          {
            max: 120,
            message: 'Название компании не должно превышать 120 символов',
          },
        ]}
      >
        <Input
          autoComplete="organization"
          placeholder="ООО «ТехноСервис»"
          size="large"
        />
      </Form.Item>

      <Form.Item<RegisterFormValues>
        label="Email владельца"
        name="email"
        rules={[
          { required: true, message: 'Введите email' },
          { type: 'email', message: 'Введите корректный email' },
          { max: 254, message: 'Email не должен превышать 254 символа' },
        ]}
      >
        <Input
          autoComplete="email"
          placeholder="owner@company.by"
          size="large"
        />
      </Form.Item>

      <Form.Item<RegisterFormValues>
        extra="Минимум 8 символов, латинская буква и цифра."
        label="Пароль"
        name="password"
        rules={[
          { required: true, message: 'Введите пароль' },
          { min: 8, message: 'Пароль должен содержать минимум 8 символов' },
          { max: 72, message: 'Пароль не должен превышать 72 символа' },
          {
            pattern: /^(?=.*[A-Za-z])(?=.*\d)\S+$/,
            message:
              'Пароль должен содержать латинскую букву, цифру и не содержать пробелы',
          },
        ]}
      >
        <Input.Password autoComplete="new-password" size="large" />
      </Form.Item>

      <Form.Item<RegisterFormValues>
        dependencies={['password']}
        label="Повторите пароль"
        name="confirmPassword"
        rules={[
          { required: true, message: 'Повторите пароль' },
          ({ getFieldValue }) => ({
            validator(_, value: string | undefined) {
              if (!value || getFieldValue('password') === value) {
                return Promise.resolve();
              }

              return Promise.reject(new Error('Пароли не совпадают'));
            },
          }),
        ]}
      >
        <Input.Password autoComplete="new-password" size="large" />
      </Form.Item>

      <Form.Item<RegisterFormValues>
        name="acceptedTerms"
        rules={[
          {
            validator(_, value: boolean | undefined) {
              return value
                ? Promise.resolve()
                : Promise.reject(new Error('Подтвердите согласие с условиями'));
            },
          },
        ]}
        valuePropName="checked"
      >
        <Checkbox>
          Я принимаю условия пользовательского соглашения и политики
          конфиденциальности
        </Checkbox>
      </Form.Item>

      <Button
        block
        disabled={!acceptedTerms}
        htmlType="submit"
        size="large"
        type="primary"
      >
        Создать компанию
      </Button>
    </Form>
  );
}
