import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { FormInstance } from 'antd';
import { Alert, Form } from 'antd';

import {
  clientDetailsQueryKey,
  ClientForm,
  clientsQueryKey,
} from '@/entities/client';
import { ApiError } from '@/shared/api';
import type {
  ClientListItemDto,
  UpdateClientDto,
} from '@/shared/api/generated/models';
import { getApiErrorMessage } from '@/shared/api/getApiErrorMessage';

import { editClientMutationKey, updateClient } from '../api/updateClient';

type EditClientFormProps = {
  form: FormInstance<UpdateClientDto>;
  companyId: string;
  client: ClientListItemDto;
  onCancel: () => void;
  onSuccess: () => void;
};

export function EditClientForm({
  form,
  companyId,
  client,
  onCancel,
  onSuccess,
}: EditClientFormProps) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationKey: editClientMutationKey(companyId, client.id),
    mutationFn: (data: UpdateClientDto) => updateClient(client.id, data),
    retry: false,
    onSuccess: async (updated) => {
      queryClient.setQueryData(
        clientDetailsQueryKey(companyId, client.id),
        updated,
      );
      await queryClient.invalidateQueries({
        queryKey: clientsQueryKey(companyId),
      });
    },
  });

  function handleFinish(values: UpdateClientDto) {
    if (mutation.isPending) return;

    const name = values.name?.trim() ?? '';
    const phone = values.phone?.trim() ?? '';
    const email = values.email?.trim().toLowerCase() || null;
    const notes = values.notes?.trim() || null;
    const data: UpdateClientDto = {};

    if (name !== client.name) data.name = name;
    if (phone !== client.phone) data.phone = phone;
    if (email !== client.email) data.email = email;
    if (notes !== client.notes) data.notes = notes;

    if (!Object.keys(data).length) {
      onCancel();
      return;
    }

    mutation.mutate(data, {
      onSuccess,
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
    });
  }

  const errorMessage =
    mutation.error instanceof ApiError && mutation.error.status === 401
      ? 'Сессия истекла. Войдите снова, чтобы сохранить изменения.'
      : getApiErrorMessage(
          mutation.error,
          'Не удалось сохранить клиента. Попробуйте ещё раз.',
        );

  return (
    <ClientForm
      form={form}
      name="edit-client"
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
  );
}
