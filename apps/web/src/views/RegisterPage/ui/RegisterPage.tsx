import { RegisterForm } from '@/features/auth';

import {
  OnboardingHintIcon,
  type OnboardingHintIconName,
} from './OnboardingHintIcon';

import styles from './RegisterPage.module.css';

const onboardingHints: Array<{
  icon: OnboardingHintIconName;
  title: string;
  description: string;
}> = [
  {
    icon: 'team',
    title: 'Добавьте клиентов',
    description: 'Импортируйте клиентскую базу и начните работу с ней.',
  },
  {
    icon: 'setting',
    title: 'Настройте сервисный цикл',
    description: 'Укажите сроки планового обслуживания оборудования.',
  },
  {
    icon: 'bell',
    title: 'Получайте напоминания',
    description: 'Не пропускайте время следующего обслуживания клиента.',
  },
];

export function RegisterPage() {
  return (
    <main className={styles.page}>
      <section className={styles.content}>
        <div className={styles.contentHeader}>
          <h1 className={styles.title}>Создайте компанию</h1>
          <p className={styles.description}>
            Заполните основные данные — после регистрации вы сразу сможете
            приступить к работе.
          </p>
        </div>

        <ol aria-label="Этапы регистрации" className={styles.steps}>
          <li aria-current="step" className={styles.stepActive}>
            <span className={styles.stepNumber}>1</span>
            <span>Компания</span>
          </li>
          <li>
            <span className={styles.stepNumber}>2</span>
            <span>Готово</span>
          </li>
        </ol>

        <div className={styles.formSection}>
          <h2 className={styles.formTitle}>Данные компании и владельца</h2>
          <p className={styles.formDescription}>
            Эти данные понадобятся для создания вашего рабочего пространства.
          </p>

          <RegisterForm />
        </div>
      </section>

      <aside className={styles.hints}>
        <h2 className={styles.hintsTitle}>После регистрации</h2>

        <ul className={styles.hintsList}>
          {onboardingHints.map(({ description, icon, title }) => (
            <li className={styles.hint} key={title}>
              <span aria-hidden className={styles.hintIcon}>
                <OnboardingHintIcon name={icon} />
              </span>
              <div>
                <h3 className={styles.hintTitle}>{title}</h3>
                <p className={styles.hintDescription}>{description}</p>
              </div>
            </li>
          ))}
        </ul>
      </aside>
    </main>
  );
}
