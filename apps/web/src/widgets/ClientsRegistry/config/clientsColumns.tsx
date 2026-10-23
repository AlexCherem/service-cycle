import type { TableColumnsType } from 'antd';
import { Button, Space, Tag } from 'antd';

import type { ClientListItemDto } from '@/shared/api/generated/models';

import { equipmentServiceStatuses } from './equipmentServiceStatuses';

export const clientsColumns: TableColumnsType<ClientListItemDto> = [
  {
    title: 'Клиент',
    dataIndex: 'name',
    render: (name: string) => (
      <Button type="link" style={{ padding: 0 }}>
        {name}
      </Button>
    ),
  },
  {
    title: 'Телефон',
    dataIndex: 'phone',
  },
  {
    title: 'Email',
    dataIndex: 'email',
    render: (value: string | null) => value || '—',
  },
  {
    title: 'Оборудование',
    dataIndex: 'equipment',
    render: (equipment: ClientListItemDto['equipment']) =>
      equipment.length ? equipment.map((item) => item.name).join(', ') : '—',
  },
  {
    title: 'Обслуживание',
    dataIndex: 'equipment',
    render: (equipment: ClientListItemDto['equipment']) => (
      <Space wrap>
        {[...new Set(equipment.map((item) => item.status))].map((status) => (
          <Tag key={status} color={equipmentServiceStatuses[status].color}>
            {equipmentServiceStatuses[status].label}
          </Tag>
        ))}
      </Space>
    ),
  },
];
