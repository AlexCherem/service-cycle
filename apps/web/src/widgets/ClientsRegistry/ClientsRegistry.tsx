'use client';

import { useState } from 'react';

import { useQuery } from '@tanstack/react-query';
import { Alert, Button, Table } from 'antd';

import { clientsQueryKey, getClients } from '@/entities/client';
import { currentUserQueryOptions } from '@/entities/session';
import type {
  ClientListItemDto,
  EquipmentServiceStatus,
} from '@/shared/api/generated/models';

import { clientsColumns } from './config/clientsColumns';
import { ClientDrawer } from './ui/ClientDrawer/ClientDrawer';
import { ClientsEmptyState } from './ui/ClientsEmptyState/ClientsEmptyState';
import { ClientsFilters } from './ui/ClientsFilters/ClientsFilters';

export function ClientsRegistry() {
  const { data: user } = useQuery(currentUserQueryOptions);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<EquipmentServiceStatus>();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const companyId = user?.companyId ?? '';
  const query = useQuery({
    queryKey: [...clientsQueryKey(companyId), { page, limit, search, status }],
    queryFn: ({ signal }) =>
      getClients(companyId, { page, limit, search, status }, signal),
    enabled: Boolean(companyId),
  });

  return (
    <>
      <ClientsFilters
        status={status}
        onSearch={(value) => {
          setSearch(value.trim());
          setPage(1);
        }}
        onStatusChange={(value) => {
          setStatus(value);
          setPage(1);
        }}
      />
      {query.isError ? (
        <Alert
          type="error"
          showIcon
          title="Не удалось загрузить клиентов"
          action={
            <Button onClick={() => void query.refetch()}>Повторить</Button>
          }
        />
      ) : (
        <Table<ClientListItemDto>
          rowKey="id"
          columns={clientsColumns}
          dataSource={query.data?.items ?? []}
          loading={query.isFetching}
          scroll={{ x: 850 }}
          locale={{
            emptyText: (
              <ClientsEmptyState filtered={Boolean(search || status)} />
            ),
          }}
          pagination={{
            current: page,
            pageSize: limit,
            total: query.data?.total ?? 0,
            showSizeChanger: true,
            pageSizeOptions: [10, 20, 50, 100],
            showTotal: (total) => `Всего клиентов: ${total}`,
            onChange: (nextPage, nextLimit) => {
              setPage(nextLimit !== limit ? 1 : nextPage);
              setLimit(nextLimit);
            },
          }}
          onRow={(client) => ({
            onClick: () => setSelectedClientId(client.id),
            style: { cursor: 'pointer' },
          })}
        />
      )}
      <ClientDrawer
        key={`${companyId}:${selectedClientId ?? ''}`}
        companyId={companyId}
        clientId={selectedClientId}
        onClose={() => setSelectedClientId(null)}
      />
    </>
  );
}
