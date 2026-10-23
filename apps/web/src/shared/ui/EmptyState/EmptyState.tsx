import type { ReactNode } from 'react';

import { Empty } from 'antd';

type EmptyStateProps = {
  filtered: boolean;
  emptyText: string;
  filteredText: string;
  children?: ReactNode;
};

export function EmptyState({
  filtered,
  emptyText,
  filteredText,
  children,
}: EmptyStateProps) {
  return (
    <Empty description={filtered ? filteredText : emptyText}>
      {!filtered && children}
    </Empty>
  );
}
