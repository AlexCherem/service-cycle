import type { ReactNode } from 'react';

import styles from './WorkspaceContainer.module.css';

type WorkspaceContainerProps = {
  children: ReactNode;
};

export function WorkspaceContainer({ children }: WorkspaceContainerProps) {
  return <div className={styles.container}>{children}</div>;
}
