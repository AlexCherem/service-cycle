import { useEffect, useState } from 'react';

import { useIsMutating, useQuery } from '@tanstack/react-query';
import { Alert, Button, Form, Space, Spin } from 'antd';

import { EditEquipmentForm } from '@/features/EditEquipment';
import { ApiError } from '@/shared/api';
import { clientDetailsQueryKey, getClient } from '@/shared/api/clients';
import {
  editEquipmentMutationKey,
  equipmentDetailsQueryKey,
  getEquipmentById,
} from '@/shared/api/equipment';
import type { UpdateEquipmentDto } from '@/shared/api/generated/models';
import { RightPanel } from '@/shared/ui/RightPanel';

import { EquipmentDetails } from '../EquipmentDetails/EquipmentDetails';

type EquipmentDrawerProps = {
  companyId: string;
  equipmentId: string | null;
  onClose: () => void;
};

export function EquipmentDrawer({
  companyId,
  equipmentId,
  onClose,
}: EquipmentDrawerProps) {
  const [form] = Form.useForm<UpdateEquipmentDto>();
  const [isEditing, setIsEditing] = useState(false);
  const isSaving =
    useIsMutating({
      mutationKey: editEquipmentMutationKey(companyId, equipmentId),
      exact: true,
    }) > 0;
  const query = useQuery({
    queryKey: equipmentDetailsQueryKey(companyId, equipmentId),
    queryFn: ({ signal }) => getEquipmentById(equipmentId!, signal),
    enabled: Boolean(companyId && equipmentId) && !isEditing,
    retry: (count, error) =>
      !(error instanceof ApiError && [400, 401, 404].includes(error.status)) &&
      count < 2,
  });
  const equipment = query.data;
  useEffect(() => {
    if (!isEditing || !equipment) return;
    form.setFieldsValue({
      name: equipment.name,
      type: equipment.type ?? '',
      manufacturer: equipment.manufacturer ?? '',
      model: equipment.model ?? '',
      serialNumber: equipment.serialNumber ?? '',
      serviceIntervalMonths: equipment.serviceIntervalMonths,
      installationDate: equipment.installationDate ?? '',
      lastServiceDate: equipment.lastServiceDate ?? '',
      nextServiceDate: equipment.nextServiceDate ?? '',
      notes: equipment.notes ?? '',
    });
  }, [equipment, form, isEditing]);

  function stopEditing() {
    form.resetFields();
    setIsEditing(false);
  }

  function closePanel() {
    if (isSaving) return;
    if (isEditing) stopEditing();
    onClose();
  }

  const clientId = query.data?.client.id ?? null;
  const clientQuery = useQuery({
    queryKey: clientDetailsQueryKey(companyId, clientId),
    queryFn: ({ signal }) => getClient(clientId!, signal),
    enabled: Boolean(companyId && equipmentId && clientId) && query.isSuccess,
  });
  const clientPhone = clientQuery.data ? (
    clientQuery.data.phone
  ) : clientQuery.isError ? (
    <span>
      Не удалось загрузить телефон.{' '}
      <Button
        type="link"
        size="small"
        onClick={() => void clientQuery.refetch()}
      >
        Повторить
      </Button>
    </span>
  ) : (
    <Spin size="small" />
  );
  const notFound =
    query.error instanceof ApiError && query.error.status === 404;

  return (
    <RightPanel
      title={
        isEditing ? 'Редактирование оборудования' : 'Карточка оборудования'
      }
      open={Boolean(equipmentId)}
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
          title={
            notFound
              ? 'Оборудование не найдено'
              : 'Не удалось загрузить карточку оборудования'
          }
          action={
            !notFound && (
              <Button onClick={() => void query.refetch()}>Повторить</Button>
            )
          }
        />
      ) : isEditing ? (
        <EditEquipmentForm
          form={form}
          companyId={companyId}
          equipment={query.data}
          onCancel={stopEditing}
          onSuccess={stopEditing}
        />
      ) : (
        <EquipmentDetails equipment={query.data} clientPhone={clientPhone} />
      )}
    </RightPanel>
  );
}
