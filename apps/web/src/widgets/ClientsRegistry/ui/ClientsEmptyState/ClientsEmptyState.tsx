import { Empty } from 'antd';

import { ButtonLink } from '@/shared/ui/ButtonLink';

type ClientsEmptyStateProps = { filtered: boolean };

export function ClientsEmptyState({ filtered }: ClientsEmptyStateProps) {
  return (
    <Empty
      description={
        filtered ? 'Клиентов по этим условиям не найдено' : 'Клиентов пока нет'
      }
    >
      {!filtered && (
        <ButtonLink href="/clients/import" type="primary">
          Импортировать базу
        </ButtonLink>
      )}
    </Empty>
  );
}
