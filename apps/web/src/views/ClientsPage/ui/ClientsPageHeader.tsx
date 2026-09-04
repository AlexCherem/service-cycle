'use client';
import { DownloadOutlined, PlusOutlined } from '@ant-design/icons';
import { Button } from 'antd';

import { ButtonLink } from '@/shared/ui/ButtonLink';

import styles from './ClientsPage.module.css';

export function ClientsPageHeader() {
  return (
    <header className={styles.header}>
      <div className={styles.heading}>
        <h1 className={styles.title}>Клиенты</h1>
      </div>

      <div className={styles.headerActions}>
        <ButtonLink
          href="/clients/import"
          color="primary"
          variant="outlined"
          icon={<DownloadOutlined />}
        >
          Импорт из Excel
        </ButtonLink>

        <Button href="/" type="primary" icon={<PlusOutlined />}>
          Добавить клиента
        </Button>
      </div>
    </header>
  );
}
