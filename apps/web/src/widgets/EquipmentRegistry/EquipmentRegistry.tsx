'use client';

import { useSearchParams } from 'next/navigation';

import { useQuery } from '@tanstack/react-query';
import { Alert, Button } from 'antd';

import { currentUserQueryOptions } from '@/shared/api/auth';
import { equipmentQueryKey, getEquipment } from '@/shared/api/equipment';
import {
  type EquipmentListItemDto,
  EquipmentServiceStatus,
} from '@/shared/api/generated/models';
import { listParams } from '@/shared/lib/url/listParams';
import { pushSearchParams } from '@/shared/lib/url/updateSearchParams';
import { ButtonLink } from '@/shared/ui/ButtonLink';
import { EmptyState } from '@/shared/ui/EmptyState';
import { Table } from '@/shared/ui/Table';

import { equipmentColumns } from './config/equipmentColumns';
import { EquipmentDrawer } from './ui/EquipmentDrawer/EquipmentDrawer';
import { EquipmentFilters } from './ui/EquipmentFilters/EquipmentFilters';

export function EquipmentRegistry() {
  const { data: user } = useQuery(currentUserQueryOptions);
  const companyId = user?.companyId ?? '';
  const searchParams = useSearchParams();
  const { page, limit, search } = listParams(searchParams);
  const equipmentId = searchParams.get('equipmentId') || null;
  const status = Object.values(EquipmentServiceStatus).find(
    (value) => value === searchParams.get('status'),
  );
  const query = useQuery({
    queryKey: [
      ...equipmentQueryKey(companyId),
      { page, limit, search, status },
    ],
    queryFn: ({ signal }) =>
      getEquipment({ page, limit, search, status }, signal),
    enabled: Boolean(companyId),
  });

  return (
    <>
      <EquipmentFilters
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
          title="Не удалось загрузить оборудование"
          action={
            <Button onClick={() => void query.refetch()}>Повторить</Button>
          }
        />
      ) : (
        <Table<EquipmentListItemDto>
          rowKey="id"
          columns={equipmentColumns}
          dataSource={query.data?.items ?? []}
          loading={query.isFetching}
          scroll={{ x: 1000 }}
          onRow={(equipment) => ({
            onClick: () => pushSearchParams({ equipmentId: equipment.id }),
            style: { cursor: 'pointer' },
          })}
          locale={{
            emptyText: (
              <EmptyState
                filtered={Boolean(search || status)}
                emptyText="Оборудование пока не добавлено"
                filteredText="Оборудование не найдено. Измените поиск или фильтр."
              >
                <ButtonLink href="/clients/import">
                  Импортировать базу
                </ButtonLink>
              </EmptyState>
            ),
          }}
          pagination={{
            current: page,
            pageSize: limit,
            total: query.data?.total ?? 0,
            showTotal: (total) => `Всего оборудования: ${total}`,
            onChange: (nextPage, nextLimit) => {
              pushSearchParams({
                page: nextLimit !== limit || nextPage === 1 ? null : nextPage,
                limit: nextLimit === 20 ? null : nextLimit,
              });
            },
          }}
        />
      )}
      <EquipmentDrawer
        key={`${companyId}:${equipmentId ?? ''}`}
        companyId={companyId}
        equipmentId={equipmentId}
        onClose={() => pushSearchParams({ equipmentId: null })}
      />
    </>
  );
}
