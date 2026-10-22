import { Descriptions, Tag } from 'antd';

import type { ClientEquipmentListItemDto } from '@/shared/api/generated/models';
import { dateLabel } from '@/shared/lib/date/dateLabel';

import { equipmentServiceStatuses } from '../../config/equipmentServiceStatuses';

export function ClientEquipmentCard({
  equipment,
}: {
  equipment: ClientEquipmentListItemDto;
}) {
  return (
    <div style={{ paddingBottom: 16, borderBottom: '1px solid #e2e8f0' }}>
      <strong>{equipment.name}</strong>{' '}
      <Tag color={equipmentServiceStatuses[equipment.status].color}>
        {equipmentServiceStatuses[equipment.status].label}
      </Tag>
      <Descriptions
        column={1}
        size="small"
        items={[
          {
            key: 'installation',
            label: 'Установка',
            children: dateLabel(equipment.installationDate),
          },
          {
            key: 'last',
            label: 'Последнее обслуживание',
            children: dateLabel(equipment.lastServiceDate),
          },
          {
            key: 'next',
            label: 'Следующее обслуживание',
            children: dateLabel(equipment.nextServiceDate),
          },
        ]}
      />
    </div>
  );
}
