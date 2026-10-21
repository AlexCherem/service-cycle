import { ClientsTable } from '@/widgets/ClientsTable';
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

        <ButtonLink href="/clients/import" type="primary">
          Импортировать базу
        </ButtonLink>
      </header>

      <ClientsTable />
    </section>
  );
}
