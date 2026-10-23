import { getImportTemplate } from '@/shared/api/client-imports';

export async function downloadImportTemplate(companyId: string) {
  const blob = await getImportTemplate(companyId);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'service-cycle-client-import-template.xlsx';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
