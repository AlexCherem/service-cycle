'use client';

import { useState } from 'react';

import {
  CheckCircleFilled,
  CheckOutlined,
  FileExcelOutlined,
} from '@ant-design/icons';

import { RegisterForm } from '@/features/auth';
import { ButtonLink } from '@/shared/ui/ButtonLink';

import styles from './RegisterPage.module.css';

export function RegistrationFlow() {
  const [step, setStep] = useState<'form' | 'done'>('form');
  const isDone = step === 'done';

  return (
    <div
      className={`${styles.registrationFlow} ${
        isDone ? styles.registrationFlowDone : ''
      }`}
    >
      <div className={styles.contentHeader}>
        <h1 className={styles.title}>
          {isDone ? 'Компания создана' : 'Создайте компанию'}
        </h1>
        <p className={styles.description}>
          {isDone
            ? 'Регистрация завершена. Можно переходить к работе.'
            : 'Заполните основные данные — после регистрации вы сразу сможете приступить к работе.'}
        </p>
      </div>

      <ol aria-label="Этапы регистрации" className={styles.steps}>
        <li
          aria-current={isDone ? undefined : 'step'}
          className={isDone ? styles.stepCompleted : styles.stepActive}
        >
          <span className={styles.stepNumber}>
            {isDone ? <CheckOutlined /> : '1'}
          </span>
          <span>Компания</span>
        </li>
        <li
          aria-current={isDone ? 'step' : undefined}
          className={isDone ? styles.stepActive : undefined}
        >
          <span className={styles.stepNumber}>2</span>
          <span>Готово</span>
        </li>
      </ol>

      {isDone ? (
        <div className={`${styles.formSection} ${styles.doneSection}`}>
          <span aria-hidden className={styles.successIcon}>
            <CheckCircleFilled />
          </span>
          <h2 className={styles.formTitle}>Загрузите первую клиентскую базу</h2>
          <p className={styles.doneDescription}>
            Подготовьте Excel-файл с данными клиентов и оборудования.
          </p>
          <div className={styles.importRequirements}>
            <FileExcelOutlined aria-hidden />
            <span>Формат .xlsx, размер до 10 МБ</span>
          </div>
          <ButtonLink
            className={styles.doneAction}
            href="/clients/import"
            size="large"
            type="primary"
          >
            Начните работу с базой
          </ButtonLink>
        </div>
      ) : (
        <div className={styles.formSection}>
          <h2 className={styles.formTitle}>Данные компании и владельца</h2>
          <p className={styles.formDescription}>
            Эти данные понадобятся для создания вашего рабочего пространства.
          </p>

          <RegisterForm onSuccessAction={() => setStep('done')} />
        </div>
      )}
    </div>
  );
}
