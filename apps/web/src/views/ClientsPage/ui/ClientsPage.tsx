
import { ClientsEmptyState } from '@/views/ClientsPage/ui/ClientsEmptyState';
import { ClientsEquipmentTablePlaceholder } from '@/views/ClientsPage/ui/ClientsEquipmentTable';
import { ClientsPageHeader } from '@/views/ClientsPage/ui/ClientsPageHeader';

import styles from './ClientsPage.module.css';

const clients: unknown[] = [];

export function ClientsPage() {
  return (
    <section className={styles.page}>
      <ClientsPageHeader />
      {clients.length > 0 ? (
        <ClientsEquipmentTablePlaceholder />
      ) : (
        <ClientsEmptyState />
      )}
    </section>
  );
}
