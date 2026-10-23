'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';

import { useQuery } from '@tanstack/react-query';
import { Alert, Button } from 'antd';

import { currentUserQueryOptions } from '@/shared/api/auth';
import { clientsQueryKey, getClients } from '@/shared/api/clients';
import {
  type ClientListItemDto,
  EquipmentServiceStatus,
} from '@/shared/api/generated/models';
import { listParams } from '@/shared/lib/url/listParams';
import { pushSearchParams } from '@/shared/lib/url/updateSearchParams';
import { ButtonLink } from '@/shared/ui/ButtonLink';
import { EmptyState } from '@/shared/ui/EmptyState';
import { Table } from '@/shared/ui/Table';

import { clientsColumns } from './config/clientsColumns';
import { ClientDrawer } from './ui/ClientDrawer/ClientDrawer';
import { ClientsFilters } from './ui/ClientsFilters/ClientsFilters';

export function ClientsRegistry() {
  const { data: user } = useQuery(currentUserQueryOptions);
  const searchParams = useSearchParams();
  const { page, limit, search } = listParams(searchParams);
  const status = Object.values(EquipmentServiceStatus).find(
    (value) => value === searchParams.get('status'),
  );
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
        search={search}
        status={status}
        onSearch={(value) => {
          pushSearchParams({ search: value.trim(), page: null });
        }}
        onStatusChange={(value) => {
          pushSearchParams({ status: value ?? null, page: null });
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
              <EmptyState
                filtered={Boolean(search || status)}
                emptyText="Клиентов пока нет"
                filteredText="Клиентов по этим условиям не найдено"
              >
                <ButtonLink href="/clients/import" type="primary">
                  Импортировать базу
                </ButtonLink>
              </EmptyState>
            ),
          }}
          pagination={{
            current: page,
            pageSize: limit,
            total: query.data?.total ?? 0,
            showTotal: (total) => `Всего клиентов: ${total}`,
            onChange: (nextPage, nextLimit) => {
              pushSearchParams({
                page: nextLimit !== limit || nextPage === 1 ? null : nextPage,
                limit: nextLimit === 20 ? null : nextLimit,
              });
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
