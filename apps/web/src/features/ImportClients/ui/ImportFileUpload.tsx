import { InboxOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';
import { Alert, Button, Space, Upload } from 'antd';

import { getApiErrorMessage } from '@/shared/api/getApiErrorMessage';

import styles from './ImportClients.module.css';

type ImportFileUploadProps = {
  uploadProps: UploadProps;
  templateLoading: boolean;
  disabled: boolean;
  templateError: unknown;
  onDownloadTemplate: () => void;
};

export function ImportFileUpload({
  uploadProps,
  templateLoading,
  disabled,
  templateError,
  onDownloadTemplate,
}: ImportFileUploadProps) {
  return (
    <>
      <Space wrap>
        <Button
          loading={templateLoading}
          disabled={disabled}
          onClick={onDownloadTemplate}
        >
          Скачать Excel-шаблон
        </Button>
        <span>Формат .xlsx, до 10 МБ</span>
      </Space>
      {Boolean(templateError) && (
        <Alert
          type="error"
          showIcon
          title={getApiErrorMessage(
            templateError,
            'Не удалось скачать шаблон. Попробуйте ещё раз.',
          )}
        />
      )}
      <Upload.Dragger {...uploadProps} rootClassName={styles.fileUpload}>
        <p className={styles.uploadIcon}>
          <InboxOutlined />
        </p>
        <p className={styles.uploadTitle}>Нажмите или перетащите Excel-файл</p>
        <p className={styles.uploadDescription}>
          Одна строка — один клиент и одна единица оборудования
        </p>
      </Upload.Dragger>
      <p className={styles.uploadDescription}>
        Обязательны имя клиента, телефон, название оборудования и серийный
        номер. Для нескольких устройств повторите клиента в отдельных строках.
        Повторный импорт обновляет оборудование по серийному номеру в пределах
        клиента.
      </p>
    </>
  );
}
