import { apiRequest } from '../apiClient';
import type { ImportPreviewDto, ImportResultDto } from '../generated/models';

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

export function getImportTemplate(companyId: string) {
  return apiRequest<Blob>(`${importPath(companyId)}/template`, {
    responseType: 'blob',
  });
}
