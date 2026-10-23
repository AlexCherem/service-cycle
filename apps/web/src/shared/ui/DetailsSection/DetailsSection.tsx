import type { ReactNode } from 'react';

import { Flex } from 'antd';

import styles from './DetailsSection.module.css';

type DetailsSectionProps = {
  title: ReactNode;
  children: ReactNode;
};

export function DetailsSection({ title, children }: DetailsSectionProps) {
  return (
    <Flex component="section" vertical gap="middle">
      <h3 className={styles.title}>{title}</h3>
      {children}
    </Flex>
  );
}
