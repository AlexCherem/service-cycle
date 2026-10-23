import { useEffect, useState } from 'react';

import { useIsMutating, useQuery } from '@tanstack/react-query';
import { Alert, Button, Form, Space, Spin } from 'antd';

import { EditClientForm, editClientMutationKey } from '@/features/EditClient';
import { clientDetailsQueryKey, getClient } from '@/entities/client';
import type { UpdateClientDto } from '@/shared/api/generated/models';
import { RightPanel } from '@/shared/ui/RightPanel';

import { ClientDetails } from '../ClientDetails/ClientDetails';

export function ClientDrawer({
  companyId,
  clientId,
  onClose,
}: {
  companyId: string;
  clientId: string | null;
  onClose: () => void;
}) {
  const [form] = Form.useForm<UpdateClientDto>();
  const [isEditing, setIsEditing] = useState(false);
  const isSaving =
    useIsMutating({
      mutationKey: editClientMutationKey(companyId, clientId),
      exact: true,
    }) > 0;
  const query = useQuery({
    queryKey: clientDetailsQueryKey(companyId, clientId),
    queryFn: ({ signal }) => getClient(clientId!, signal),
    enabled: Boolean(companyId && clientId) && !isEditing,
  });

  const client = query.data;

  useEffect(() => {
    if (!isEditing || !client) return;

    form.setFieldsValue({
      name: client.name,
      phone: client.phone,
      email: client.email ?? '',
      notes: client.notes ?? '',
    });
  }, [client, isEditing, form]);

  function stopEditing() {
    form.resetFields();
    setIsEditing(false);
  }

  function closePanel() {
    if (isSaving) return;
    if (isEditing) stopEditing();
    onClose();
  }

  return (
    <RightPanel
      title={isEditing ? 'Редактирование клиента' : 'Карточка клиента'}
      open={Boolean(clientId)}
      onClose={closePanel}
      showCloseButton={!isEditing}
      keyboard={!isSaving}
      mask={{ closable: !isSaving }}
      extra={
        isEditing ? (
          <Space>
            <Button onClick={stopEditing} disabled={isSaving}>
              Отмена
            </Button>
            <Button
              type="primary"
              onClick={() => form.submit()}
              loading={isSaving}
            >
              Сохранить
            </Button>
          </Space>
        ) : (
          <Button
            onClick={() => setIsEditing(true)}
            disabled={!query.isSuccess || query.isFetching || isSaving}
          >
            Редактировать
          </Button>
        )
      }
    >
      {query.isPending ? (
        <Spin />
      ) : query.isError ? (
        <Alert
          type="error"
          showIcon
          title="Не удалось загрузить карточку"
          action={
            <Button onClick={() => void query.refetch()}>Повторить</Button>
          }
        />
      ) : isEditing ? (
        <EditClientForm
          form={form}
          companyId={companyId}
          client={query.data}
          onCancel={stopEditing}
          onSuccess={stopEditing}
        />
      ) : (
        <ClientDetails client={query.data} />
      )}
    </RightPanel>
  );
}
