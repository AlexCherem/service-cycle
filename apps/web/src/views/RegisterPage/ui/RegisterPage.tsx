import {
  OnboardingHintIcon,
  type OnboardingHintIconName,
} from './OnboardingHintIcon';
import { RegistrationFlow } from './RegistrationFlow';

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
        <RegistrationFlow />
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
