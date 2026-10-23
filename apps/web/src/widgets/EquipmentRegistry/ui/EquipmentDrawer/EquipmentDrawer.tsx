import { useQuery } from '@tanstack/react-query';
import { Alert, Button, Spin } from 'antd';

import { ApiError } from '@/shared/api';
import { clientDetailsQueryKey, getClient } from '@/shared/api/clients';
import {
  equipmentDetailsQueryKey,
  getEquipmentById,
} from '@/shared/api/equipment';
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
  const query = useQuery({
    queryKey: equipmentDetailsQueryKey(companyId, equipmentId),
    queryFn: ({ signal }) => getEquipmentById(equipmentId!, signal),
    enabled: Boolean(companyId && equipmentId),
    retry: (count, error) =>
      !(error instanceof ApiError && [400, 401, 404].includes(error.status)) &&
      count < 2,
  });
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
      title="Карточка оборудования"
      open={Boolean(equipmentId)}
      onClose={onClose}
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
      ) : (
        <EquipmentDetails equipment={query.data} clientPhone={clientPhone} />
      )}
    </RightPanel>
  );
}
