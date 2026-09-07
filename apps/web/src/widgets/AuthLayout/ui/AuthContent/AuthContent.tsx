import type { ReactNode } from 'react';

import styles from './AuthContent.module.css';

type AuthContentProps = {
  children: ReactNode;
};

export function AuthContent({ children }: AuthContentProps) {
  return <div className={styles.content}>{children}</div>;
}
