import type { TableColumnsType } from 'antd';
import { Tag } from 'antd';

import type { ImportPreviewRowDto } from '@/shared/api/generated/models';
import { dateLabel } from '@/shared/lib/date/dateLabel';

export const importPreviewColumns: TableColumnsType<ImportPreviewRowDto> = [
  { title: 'Строка', dataIndex: 'rowNumber', width: 85 },
  {
    title: 'Клиент',
    render: (_, row) => (
      <>
        {row.data.name || '—'}
        <br />
        {row.data.phone || '—'}
        <br />
        {row.data.email}
      </>
    ),
  },
  {
    title: 'Оборудование',
    render: (_, row) => (
      <>
        {row.data.equipment || '—'}
        <br />
        <small>Серийный номер: {row.data.serialNumber || '—'}</small>
        <br />
        <small>
          {[row.data.manufacturer, row.data.model].filter(Boolean).join(' ')}
        </small>
      </>
    ),
  },
  {
    title: 'Следующее обслуживание',
    render: (_, row) => dateLabel(row.data.nextServiceDate, 'Не назначено'),
  },
  {
    title: 'Проверка',
    render: (_, row) => (
      <>
        <Tag color={row.isValid ? 'green' : 'red'}>
          {row.isValid ? 'Готово' : 'Будет пропущена'}
        </Tag>
        {row.errors.map((error, index) => (
          <div key={`error-${index}`} style={{ color: '#b42318' }}>
            {error}
          </div>
        ))}
        {row.warnings.map((warning, index) => (
          <div key={`warning-${index}`} style={{ color: '#8a6100' }}>
            {warning}
          </div>
        ))}
      </>
    ),
  },
];
