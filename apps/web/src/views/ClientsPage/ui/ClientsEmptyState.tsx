'use client';
import {
  DownloadOutlined,
  PlusOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { Button } from 'antd';

import { ButtonLink } from '@/shared/ui/ButtonLink';

import styles from './ClientsPage.module.css';

export function ClientsEmptyState() {
  return (
    <div className={styles.emptyState}>
      <div className={styles.emptyStateContent}>
        <div className={styles.emptyStateIcon} aria-hidden="true">
          <TeamOutlined />
        </div>
        <span className={styles.emptyStateEyebrow}>Клиентская база</span>

        <h2 className={styles.emptyStateTitle}>Клиентов пока нет</h2>

        <p className={styles.emptyStateDescription}>
          Импортируйте клиентскую базу из Excel или добавьте первого клиента
          вручную.
        </p>

        <div className={styles.emptyStateActions}>
          <ButtonLink
            className={styles.emptyStateButton}
            href="/clients/import"
            icon={<DownloadOutlined />}
            type="primary"
          >
            Импортировать из Excel
          </ButtonLink>

          <Button
            className={styles.emptyStateButton}
            icon={<PlusOutlined />}
            color="primary"
            variant="outlined"
          >
            Добавить клиента
          </Button>
        </div>

        <p className={styles.emptyStateHint}>
          Excel — для массового импорта. Вручную — для одного клиента.
        </p>
      </div>
    </div>
  );
}
