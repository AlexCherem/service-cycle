import { LoginForm } from '@/features/auth';

import styles from './LoginPage.module.css';

export function LoginPage() {
  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <header className={styles.header}>
          <h1 className={styles.title}>Вход в Service Cycle</h1>
          <p className={styles.description}>
            Введите данные учётной записи вашей компании.
          </p>
        </header>

        <LoginForm />
      </section>
    </main>
  );
}
