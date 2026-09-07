'use client';

import { type ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, Button, Spin } from 'antd';

import { currentUserQueryOptions } from '@/entities/session';
import { ApiError } from '@/shared/api';

import styles from './SessionGuard.module.css';

type SessionGuardProps = {
  access: 'authenticated' | 'guest';
  children: ReactNode;
};

export function SessionGuard({ access, children }: SessionGuardProps) {
  return access === 'authenticated' ? (
    <AuthenticatedSessionGuard>{children}</AuthenticatedSessionGuard>
  ) : (
    <GuestSessionGuard>{children}</GuestSessionGuard>
  );
}

function AuthenticatedSessionGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const currentUserQuery = useQuery(currentUserQueryOptions);
  const isUnauthorized = isUnauthorizedError(currentUserQuery.error);

  useEffect(() => {
    if (isUnauthorized) {
      router.replace('/login');
    }
  }, [isUnauthorized, router]);

  if (currentUserQuery.isPending || isUnauthorized) {
    return <SessionLoading />;
  }

  if (currentUserQuery.isError) {
    return (
      <SessionError onRetryAction={() => void currentUserQuery.refetch()} />
    );
  }

  return children;
}

type GuestCheckStatus = 'checking' | 'guest' | 'error';

function GuestSessionGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<GuestCheckStatus>('checking');

  useEffect(() => {
    let cancelled = false;

    void queryClient
      .fetchQuery(currentUserQueryOptions)
      .then(() => {
        if (!cancelled) {
          router.replace('/');
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setStatus(isUnauthorizedError(error) ? 'guest' : 'error');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [queryClient, router]);

  const retry = () => {
    setStatus('checking');

    void queryClient
      .fetchQuery(currentUserQueryOptions)
      .then(() => router.replace('/'))
      .catch((error: unknown) => {
        setStatus(isUnauthorizedError(error) ? 'guest' : 'error');
      });
  };

  if (status === 'checking') {
    return <SessionLoading />;
  }

  if (status === 'error') {
    return <SessionError onRetryAction={retry} />;
  }

  return children;
}

function SessionLoading() {
  return (
    <div className={styles.state}>
      <Spin size="large" />
      <p className={styles.stateText}>Проверяем авторизацию…</p>
    </div>
  );
}

function SessionError({ onRetryAction }: { onRetryAction: () => void }) {
  return (
    <div className={styles.state}>
      <Alert
        action={
          <Button onClick={onRetryAction} size="small">
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

function isUnauthorizedError(error: unknown): boolean {
  return error instanceof ApiError && error.status === 401;
}
