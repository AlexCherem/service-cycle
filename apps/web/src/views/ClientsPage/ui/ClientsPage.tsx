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

      <div className={styles.emptyState}>
        <h2 className={styles.emptyStateTitle}>Клиентов пока нет</h2>

        <p className={styles.emptyStateDescription}>
          Импортируйте существующую клиентскую базу из Excel-файла, чтобы начать
          работу.
        </p>

        <ButtonLink href="/clients/import" type="primary">
          Импортировать базу
        </ButtonLink>
      </div>
    </section>
  );
}
