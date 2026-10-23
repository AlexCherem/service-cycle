import { useState } from 'react';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { UploadFile, UploadProps } from 'antd';
import { Upload } from 'antd';

import { ApiError } from '@/shared/api';
import { currentUserQueryOptions } from '@/shared/api/auth';
import { importClients, previewClients } from '@/shared/api/client-imports';
import { clientsQueryKey } from '@/shared/api/clients';
import { equipmentQueryKey } from '@/shared/api/equipment';

import { downloadImportTemplate } from '../lib/downloadImportTemplate';

export function useClientsImport() {
  const { data: user } = useQuery(currentUserQueryOptions);
  const companyId = user?.companyId ?? '';
  const queryClient = useQueryClient();
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [skipConfirmed, setSkipConfirmed] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const previewMutation = useMutation({
    mutationFn: (file: File) => previewClients(companyId, file),
  });
  const importMutation = useMutation({
    mutationFn: ({ file, hash }: { file: File; hash: string }) =>
      importClients(companyId, file, hash),
    retry: false,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: clientsQueryKey(companyId),
      });
      void queryClient.invalidateQueries({
        queryKey: equipmentQueryKey(companyId),
      });
    },
  });
  const templateMutation = useMutation({
    mutationFn: () => downloadImportTemplate(companyId),
  });
  const preview = previewMutation.data;
  const result = importMutation.data;
  const busy = previewMutation.isPending || importMutation.isPending;
  const conflict =
    importMutation.error instanceof ApiError &&
    importMutation.error.status === 409;

  function resetPreview() {
    previewMutation.reset();
    importMutation.reset();
    setSkipConfirmed(false);
    setFileError(null);
  }

  const uploadProps: UploadProps = {
    accept: '.xlsx',
    maxCount: 1,
    fileList,
    disabled: busy,
    beforeUpload: (file) => {
      if (
        !file.name.toLowerCase().endsWith('.xlsx') ||
        file.size > 10 * 1024 * 1024
      ) {
        setFileError('Выберите Excel-файл .xlsx размером до 10 МБ.');
        return Upload.LIST_IGNORE;
      }
      return false;
    },
    onChange: ({ fileList: next }) => {
      resetPreview();
      setFileList(next.slice(-1));
    },
    onRemove: () => {
      resetPreview();
      setFileList([]);
    },
  };

  function checkFile() {
    const file = fileList[0]?.originFileObj;
    if (!file || !companyId) return;
    importMutation.reset();
    setSkipConfirmed(false);
    previewMutation.mutate(file);
  }

  function confirmImport() {
    const file = fileList[0]?.originFileObj;
    if (file && preview)
      importMutation.mutate({ file, hash: preview.fileHash });
  }

  function restartImport() {
    resetPreview();
    setFileList([]);
  }

  const canImport =
    Boolean(companyId) &&
    !busy &&
    !conflict &&
    Boolean(preview?.validRowCount) &&
    (!preview?.invalidRowCount || skipConfirmed);

  return {
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
  };
}
