'use client';

import { useState } from 'react';

import { PlusOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, Button, Form, message, Space } from 'antd';

import { ClientForm } from '@/entities/client';
import { ApiError } from '@/shared/api';
import { currentUserQueryOptions } from '@/shared/api/auth';
import { clientsQueryKey, createClient } from '@/shared/api/clients';
import type { CreateClientDto } from '@/shared/api/generated/models';
import { getApiErrorMessage } from '@/shared/api/getApiErrorMessage';
import { RightPanel } from '@/shared/ui/RightPanel';

export function CreateClient() {
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm<CreateClientDto>();
  const [messageApi, contextHolder] = message.useMessage();
  const { data: user } = useQuery(currentUserQueryOptions);
  const companyId = user?.companyId;
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: createClient,
    retry: false,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: clientsQueryKey(companyId!),
      });
      setOpen(false);
      form.resetFields();
      void messageApi.success('Клиент добавлен');
    },
  });

  function openForm() {
    mutation.reset();
    setOpen(true);
  }

  function closeForm() {
    if (mutation.isPending) return;
    setOpen(false);
    form.resetFields();
    mutation.reset();
  }

  function handleFinish(values: CreateClientDto) {
    if (!companyId || mutation.isPending) return;

    mutation.mutate(
      {
        name: values.name.trim(),
        phone: values.phone.trim(),
        email: values.email?.trim().toLowerCase() || null,
        notes: values.notes?.trim() || null,
      },
      {
        onError: (error) => {
          if (error instanceof ApiError && error.status === 409) {
            form.setFields([
              {
                name: 'phone',
                errors: ['Клиент с таким телефоном уже существует в компании.'],
              },
            ]);
          }
        },
      },
    );
  }

  const errorMessage =
    mutation.error instanceof ApiError && mutation.error.status === 401
      ? 'Сессия истекла. Войдите снова, чтобы добавить клиента.'
      : getApiErrorMessage(
          mutation.error,
          'Не удалось добавить клиента. Попробуйте ещё раз.',
        );

  return (
    <>
      {contextHolder}
      <Button
        type="primary"
        icon={<PlusOutlined />}
        onClick={openForm}
        disabled={!companyId}
      >
        Добавить клиента
      </Button>
      <RightPanel
        title="Добавление клиента"
        open={open}
        onClose={closeForm}
        showCloseButton={false}
        keyboard={!mutation.isPending}
        mask={{ closable: !mutation.isPending }}
        extra={
          <Space>
            <Button onClick={closeForm} disabled={mutation.isPending}>
              Отмена
            </Button>
            <Button
              type="primary"
              onClick={() => form.submit()}
              loading={mutation.isPending}
              disabled={!companyId}
            >
              Создать
            </Button>
          </Space>
        }
      >
        <ClientForm<CreateClientDto>
          form={form}
          name="create-client"
          disabled={mutation.isPending}
          onFinish={handleFinish}
          onValuesChange={() => {
            if (mutation.isError) mutation.reset();
          }}
        >
          {mutation.isError && (
            <Form.Item>
              <Alert type="error" showIcon title={errorMessage} />
            </Form.Item>
          )}
        </ClientForm>
      </RightPanel>
    </>
  );
}
