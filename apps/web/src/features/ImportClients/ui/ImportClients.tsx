'use client';

import { Alert, Button, Space, Steps } from 'antd';

import { getApiErrorMessage } from '@/shared/api/getApiErrorMessage';
import { ButtonLink } from '@/shared/ui/ButtonLink';

import { useClientsImport } from '../model/useClientsImport';
import { ImportFileUpload } from './ImportFileUpload';
import { ImportPreview } from './ImportPreview';
import { ImportResult } from './ImportResult';

import styles from './ImportClients.module.css';

export function ImportClients() {
  const {
    companyId,
    fileList,
    fileError,
    skipConfirmed,
    setSkipConfirmed,
    previewMutation,
    importMutation,
    templateMutation,
    preview,
    result,
    busy,
    conflict,
    uploadProps,
    checkFile,
    confirmImport,
    restartImport,
    canImport,
  } = useClientsImport();

  if (result) return <ImportResult result={result} onRestart={restartImport} />;

  return (
    <div className={styles.container}>
      <Steps
        current={preview ? 1 : 0}
        items={[
          { title: 'Выбор файла' },
          { title: 'Проверка и подтверждение' },
          { title: 'Результат' },
        ]}
      />
      <ImportFileUpload
        uploadProps={uploadProps}
        templateLoading={templateMutation.isPending}
        disabled={!companyId}
        templateError={templateMutation.error}
        onDownloadTemplate={() => templateMutation.mutate()}
      />
      {fileError && <Alert type="error" showIcon title={fileError} />}
      {previewMutation.isError && (
        <Alert
          type="error"
          showIcon
          title={getApiErrorMessage(
            previewMutation.error,
            'Не удалось проверить файл. Попробуйте ещё раз.',
          )}
        />
      )}
      {importMutation.isError && (
        <Alert
          type="error"
          showIcon
          title={getApiErrorMessage(
            importMutation.error,
            'Не удалось выполнить импорт. Попробуйте ещё раз.',
          )}
          description={
            conflict
              ? 'Выполните проверку файла заново перед подтверждением.'
              : undefined
          }
        />
      )}
      <Space wrap>
        <Button
          loading={previewMutation.isPending}
          disabled={!companyId || !fileList.length || importMutation.isPending}
          onClick={checkFile}
        >
          {preview ? 'Проверить заново' : 'Проверить файл'}
        </Button>
        {!busy && <ButtonLink href="/clients">Отмена</ButtonLink>}
      </Space>
      {preview && !previewMutation.isPending && (
        <ImportPreview
          preview={preview}
          skipConfirmed={skipConfirmed}
          disabled={busy}
          importing={importMutation.isPending}
          canImport={canImport}
          onSkipConfirmedChange={setSkipConfirmed}
          onConfirm={confirmImport}
        />
      )}
    </div>
  );
}
