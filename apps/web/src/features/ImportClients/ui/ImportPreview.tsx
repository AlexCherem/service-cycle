import { Alert, Button, Checkbox, Table } from 'antd';

import type {
  ImportPreviewDto,
  ImportPreviewRowDto,
} from '@/shared/api/generated/models';

import { importPreviewColumns } from '../config/importPreviewColumns';

import styles from './ImportClients.module.css';

type ImportPreviewProps = {
  preview: ImportPreviewDto;
  skipConfirmed: boolean;
  disabled: boolean;
  importing: boolean;
  canImport: boolean;
  onSkipConfirmedChange: (confirmed: boolean) => void;
  onConfirm: () => void;
};

export function ImportPreview({
  preview,
  skipConfirmed,
  disabled,
  importing,
  canImport,
  onSkipConfirmedChange,
  onConfirm,
}: ImportPreviewProps) {
  return (
    <>
      <Alert
        showIcon
        type={preview.invalidRowCount ? 'warning' : 'success'}
        title={`Готово к импорту: ${preview.validRowCount}. С ошибками: ${preview.invalidRowCount}.`}
        description={`Лист «${preview.worksheetName}». Строки с ошибками будут пропущены. Предупреждения не мешают импорту.`}
      />
      <Table<ImportPreviewRowDto>
        rowKey="rowNumber"
        columns={importPreviewColumns}
        dataSource={preview.rows}
        pagination={{ defaultPageSize: 10, showSizeChanger: true }}
        scroll={{ x: 900 }}
      />
      {preview.validRowCount > 0 && preview.invalidRowCount > 0 && (
        <Checkbox
          checked={skipConfirmed}
          disabled={disabled}
          onChange={(event) => onSkipConfirmedChange(event.target.checked)}
        >
          Импортировать корректные строки и пропустить {preview.invalidRowCount}{' '}
          строк с ошибками
        </Checkbox>
      )}
      {preview.validRowCount === 0 && (
        <Alert
          type="warning"
          showIcon
          title="Нет корректных строк. Исправьте файл и проверьте его заново."
        />
      )}
      <div className={styles.actions}>
        <Button
          type="primary"
          loading={importing}
          disabled={!canImport}
          onClick={onConfirm}
        >
          Подтвердить импорт
        </Button>
      </div>
    </>
  );
}
