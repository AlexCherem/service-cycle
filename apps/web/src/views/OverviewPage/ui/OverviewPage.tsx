import styles from './OverviewPage.module.css';

export function OverviewPage() {
  return (
    <section className={styles.page}>
      <header>
        <h1 className={styles.title}>Обзор</h1>
        <p className={styles.description}>
          Контроль планового обслуживания и возврата клиентов.
        </p>
      </header>

      <div className={styles.emptyState}>
        <h2 className={styles.emptyStateTitle}>Пока нет данных для обзора</h2>
        <p className={styles.emptyStateDescription}>
          После добавления клиентов и настройки сервисных циклов здесь появятся
          ближайшие обслуживания и результаты напоминаний.
        </p>
      </div>
    </section>
  );
}
