import { ImportClients } from '@/features/ImportClients';

import styles from './ClientsImportPage.module.css';
export function ClientsImportPage() {
  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Импорт клиентов</h1>
        <p className={styles.description}>
          Загрузите клиентскую базу из Excel-файла.
        </p>
      </header>

      <ImportClients />
    </section>
  );
}
