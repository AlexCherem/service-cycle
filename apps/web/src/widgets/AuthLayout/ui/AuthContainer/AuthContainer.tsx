import type { ReactNode } from 'react';

import styles from './AuthContainer.module.css';

type AuthContainerProps = {
  children: ReactNode;
};

export function AuthContainer({ children }: AuthContainerProps) {
  return <div className={styles.container}>{children}</div>;
}
