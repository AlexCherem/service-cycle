'use client';

import { useRouter } from 'next/navigation';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert, Button, Form, Input } from 'antd';

import { currentUserQueryKey } from '@/entities/session';
import { ApiError, login } from '@/shared/api';
import type { LoginDto } from '@/shared/api/generated/models';

export function LoginForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: (user) => {
      queryClient.setQueryData(currentUserQueryKey, user);
      router.replace('/');
    },
  });
  const errorMessage =
    loginMutation.error instanceof ApiError &&
    loginMutation.error.status === 401
      ? 'Неверный email или пароль.'
      : 'Не удалось войти. Попробуйте ещё раз.';

  return (
    <Form<LoginDto>
      layout="vertical"
      name="login"
      onFinish={(credentials) => loginMutation.mutate(credentials)}
      onValuesChange={() => loginMutation.reset()}
      requiredMark={false}
    >
      {loginMutation.isError && (
        <Alert message={errorMessage} showIcon type="error" />
      )}

      <Form.Item<LoginDto>
        label="Email"
        name="email"
        rules={[
          { required: true, message: 'Введите email' },
          { type: 'email', message: 'Введите корректный email' },
          { max: 254, message: 'Email не должен превышать 254 символа' },
        ]}
      >
        <Input autoComplete="email" placeholder="name@company.by" />
      </Form.Item>

      <Form.Item<LoginDto>
        label="Пароль"
        name="password"
        rules={[
          { required: true, message: 'Введите пароль' },
          { max: 72, message: 'Пароль не должен превышать 72 символа' },
        ]}
      >
        <Input.Password autoComplete="current-password" />
      </Form.Item>

      <Button
        block
        htmlType="submit"
        loading={loginMutation.isPending}
        type="primary"
      >
        Войти
      </Button>
    </Form>
  );
}
