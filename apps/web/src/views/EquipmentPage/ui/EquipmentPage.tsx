import { Suspense } from 'react';

import { Spin } from 'antd';

import { EquipmentRegistry } from '@/widgets/EquipmentRegistry';

import styles from './EquipmentPage.module.css';

export function EquipmentPage() {
  return (
    <section className={styles.page}>
      <header className={styles.heading}>
        <h1 className={styles.title}>Оборудование</h1>
        <p className={styles.description}>
          Реестр оборудования клиентов и сроки планового обслуживания.
        </p>
      </header>
      <Suspense fallback={<Spin />}>
        <EquipmentRegistry />
      </Suspense>
    </section>
  );
}
