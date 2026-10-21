import { useQuery } from '@tanstack/react-query';
import { Alert, Button, Descriptions, Drawer, Empty, Spin } from 'antd';

import { clientsQueryKey, getClient } from '@/entities/client';

import { ClientEquipmentCard } from './ClientEquipmentCard';

export function ClientDrawer({
  companyId,
  clientId,
  onClose,
}: {
  companyId: string;
  clientId: string | null;
  onClose: () => void;
}) {
  const query = useQuery({
    queryKey: [...clientsQueryKey(companyId), 'detail', clientId],
    queryFn: ({ signal }) => getClient(clientId!, signal),
    enabled: Boolean(companyId && clientId),
  });

  return (
    <Drawer
      title="Карточка клиента"
      open={Boolean(clientId)}
      onClose={onClose}
      size={640}
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
      ) : (
        <>
          <Descriptions
            column={1}
            items={[
              { key: 'name', label: 'Клиент', children: query.data.name },
              {
                key: 'phone',
                label: 'Телефон',
                children: query.data.phone || '—',
              },
              {
                key: 'email',
                label: 'Email',
                children: query.data.email || '—',
              },
            ]}
          />
          <h3>Оборудование</h3>
          {query.data.equipment.length ? (
            query.data.equipment.map((equipment) => (
              <ClientEquipmentCard key={equipment.id} equipment={equipment} />
            ))
          ) : (
            <Empty description="Оборудование не добавлено" />
          )}
        </>
      )}
    </Drawer>
  );
}
