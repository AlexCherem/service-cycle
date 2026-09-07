'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert, Button, Checkbox, Form, Input } from 'antd';

import { currentUserQueryKey } from '@/entities/session';
import { ApiError, register } from '@/shared/api';
import type { RegisterDto } from '@/shared/api/generated/models';

import styles from './RegisterForm.module.css';

type RegisterFormValues = RegisterDto & {
  confirmPassword: string;
  acceptedTerms: boolean;
};

type RegisterFormProps = {
  onSuccessAction: () => void;
};

export function RegisterForm({ onSuccessAction }: RegisterFormProps) {
  const [form] = Form.useForm<RegisterFormValues>();
  const acceptedTerms = Form.useWatch('acceptedTerms', form);
  const queryClient = useQueryClient();
  const registerMutation = useMutation({
    mutationFn: register,
    onSuccess: (user) => {
      queryClient.setQueryData(currentUserQueryKey, user);
      onSuccessAction();
    },
  });
  const errorMessage =
    registerMutation.error instanceof ApiError &&
    registerMutation.error.status === 409
      ? 'Пользователь с таким email уже зарегистрирован.'
      : 'Не удалось создать компанию. Проверьте данные и попробуйте ещё раз.';

  const handleFinish = (values: RegisterFormValues) => {
    registerMutation.mutate({
      companyName: values.companyName,
      email: values.email,
      password: values.password,
    });
  };

  return (
    <Form<RegisterFormValues>
      className={styles.form}
      form={form}
      layout="vertical"
      name="register"
      onFinish={handleFinish}
      onValuesChange={() => {
        if (registerMutation.isError) {
          registerMutation.reset();
        }
      }}
      requiredMark={false}
      scrollToFirstError
    >
      {registerMutation.isError && (
        <Alert
          className={styles.alert}
          message={errorMessage}
          showIcon
          type="error"
        />
      )}

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
        loading={registerMutation.isPending}
        size="large"
        type="primary"
      >
        Создать компанию
      </Button>
    </Form>
  );
}
