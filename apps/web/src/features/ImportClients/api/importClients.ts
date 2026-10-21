import { apiRequest } from '@/shared/api';
import type {
  ImportPreviewDto,
  ImportResultDto,
} from '@/shared/api/generated/models';

function importPath(companyId: string) {
  return `/api/v1/companies/${companyId}/client-imports`;
}

export function previewClients(companyId: string, file: File) {
  const body = new FormData();
  body.append('file', file);
  return apiRequest<ImportPreviewDto>(`${importPath(companyId)}/preview`, {
    method: 'POST',
    body,
  });
}

export function importClients(
  companyId: string,
  file: File,
  previewHash: string,
) {
  const body = new FormData();
  body.append('file', file);
  body.append('previewHash', previewHash);
  return apiRequest<ImportResultDto>(importPath(companyId), {
    method: 'POST',
    body,
  });
}

export async function downloadImportTemplate(companyId: string) {
  const blob = await apiRequest<Blob>(`${importPath(companyId)}/template`, {
    responseType: 'blob',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'service-cycle-client-import-template.xlsx';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
