import { Suspense } from 'react';

import { Flex, Spin } from 'antd';

import { ClientsRegistry } from '@/widgets/ClientsRegistry';
import { CreateClient } from '@/features/CreateClient';
import { ButtonLink } from '@/shared/ui/ButtonLink';

import styles from './ClientsPage.module.css';

export function ClientsPage() {
  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <div className={styles.heading}>
          <h1 className={styles.title}>Клиенты</h1>

          <p className={styles.description}>
            Управляйте клиентской базой и плановым обслуживанием оборудования.
          </p>
        </div>

        <Flex gap={8} wrap>
          <ButtonLink href="/clients/import">Импортировать базу</ButtonLink>
          <CreateClient />
        </Flex>
      </header>

      <Suspense fallback={<Spin />}>
        <ClientsRegistry />
      </Suspense>
    </section>
  );
}
