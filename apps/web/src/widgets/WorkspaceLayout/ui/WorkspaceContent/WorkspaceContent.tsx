import type { ReactNode } from 'react';

import styles from './WorkspaceContent.module.css';

type WorkspaceContentProps = {
  children: ReactNode;
};

export function WorkspaceContent({ children }: WorkspaceContentProps) {
  return <main className={styles.content}>{children}</main>;
}
