import type { TableColumnsType } from 'antd';
import { Tag } from 'antd';

import { equipmentServiceStatuses } from '@/entities/equipment';
import type { EquipmentListItemDto } from '@/shared/api/generated/models';
import { dateLabel } from '@/shared/lib/date/dateLabel';

export const equipmentColumns: TableColumnsType<EquipmentListItemDto> = [
  { title: 'Оборудование', dataIndex: 'name' },
  { title: 'Клиент', dataIndex: ['client', 'name'] },
  {
    title: 'Установка',
    dataIndex: 'installationDate',
    render: (value: EquipmentListItemDto['installationDate']) =>
      dateLabel(value),
  },
  {
    title: 'Последнее обслуживание',
    dataIndex: 'lastServiceDate',
    render: (value: EquipmentListItemDto['lastServiceDate']) =>
      dateLabel(value),
  },
  {
    title: 'Следующее обслуживание',
    dataIndex: 'nextServiceDate',
    render: (value: EquipmentListItemDto['nextServiceDate']) =>
      dateLabel(value),
  },
  {
    title: 'Статус',
    dataIndex: 'status',
    render: (status: EquipmentListItemDto['status']) => (
      <Tag color={equipmentServiceStatuses[status].color}>
        {equipmentServiceStatuses[status].label}
      </Tag>
    ),
  },
];
