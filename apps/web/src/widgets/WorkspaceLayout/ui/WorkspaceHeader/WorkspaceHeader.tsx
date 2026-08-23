'use client';

import { BellOutlined } from '@ant-design/icons';
import { Avatar, Button } from 'antd';

import styles from './WorkspaceHeader.module.css';

const MOCK_COMPANY_NAME = 'Сервисный центр';
const MOCK_USER_NAME = 'Александр';

export function WorkspaceHeader() {
  const userInitial = MOCK_USER_NAME.charAt(0);

  return (
    <header className={styles.header}>
      <div className={styles.company}>
        <span className={styles.eyebrow}>Рабочее пространство</span>
        <span className={styles.companyName}>{MOCK_COMPANY_NAME}</span>
      </div>

      <div className={styles.actions}>
        <Button
          aria-label="Уведомления"
          className={styles.notificationButton}
          icon={<BellOutlined />}
          type="text"
        />

        <div className={styles.user}>
          <Avatar className={styles.avatar}>{userInitial}</Avatar>
          <span className={styles.userName}>{MOCK_USER_NAME}</span>
        </div>
      </div>
    </header>
  );
}
