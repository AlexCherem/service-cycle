'use client';

import { type ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { useQuery } from '@tanstack/react-query';
import { Alert, Button, Spin } from 'antd';

import { currentUserQueryOptions } from '@/entities/session';
import { ApiError } from '@/shared/api';

import styles from './RequireAuth.module.css';

type RequireAuthProps = {
  children: ReactNode;
};

export function RequireAuth({ children }: RequireAuthProps) {
  const router = useRouter();
  const currentUserQuery = useQuery(currentUserQueryOptions);
  const isUnauthorized =
    currentUserQuery.error instanceof ApiError &&
    currentUserQuery.error.status === 401;

  useEffect(() => {
    if (isUnauthorized) {
      router.replace('/login');
    }
  }, [isUnauthorized, router]);

  if (currentUserQuery.isPending || isUnauthorized) {
    return (
      <div className={styles.state}>
        <Spin size="large" />
        <p className={styles.stateText}>Проверяем авторизацию…</p>
      </div>
    );
  }

  if (currentUserQuery.isError) {
    return (
      <div className={styles.state}>
        <Alert
          action={
            <Button
              onClick={() => void currentUserQuery.refetch()}
              size="small"
            >
              Повторить
            </Button>
          }
          description="Не удалось проверить текущую сессию. Попробуйте ещё раз."
          message="Ошибка соединения"
          showIcon
          type="error"
        />
      </div>
    );
  }

  return children;
}
