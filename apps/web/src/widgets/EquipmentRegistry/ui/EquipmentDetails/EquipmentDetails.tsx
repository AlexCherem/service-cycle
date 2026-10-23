import type { ReactNode } from 'react';

import { Descriptions, Flex, Tag } from 'antd';

import { equipmentServiceStatuses } from '@/entities/equipment';
import type { EquipmentDetailsResponseDto } from '@/shared/api/generated/models';
import { dateLabel } from '@/shared/lib/date/dateLabel';
import { DetailsSection } from '@/shared/ui/DetailsSection';

type EquipmentDetailsProps = {
  equipment: EquipmentDetailsResponseDto;
  clientPhone: ReactNode;
};

export function EquipmentDetails({
  equipment,
  clientPhone,
}: EquipmentDetailsProps) {
  const status = equipmentServiceStatuses[equipment.status];
  return (
    <Flex vertical gap="large">
      <DetailsSection title={equipment.name}>
        <Descriptions
          column={1}
          items={[
            { key: 'type', label: 'Тип', children: equipment.type || '—' },
            {
              key: 'manufacturer',
              label: 'Производитель',
              children: equipment.manufacturer || '—',
            },
            { key: 'model', label: 'Модель', children: equipment.model || '—' },
            {
              key: 'serialNumber',
              label: 'Серийный номер',
              children: equipment.serialNumber || '—',
            },
          ]}
        />
      </DetailsSection>
      <DetailsSection title="Клиент">
        <Descriptions
          column={1}
          items={[
            { key: 'name', label: 'Имя', children: equipment.client.name },
            { key: 'phone', label: 'Телефон', children: clientPhone },
          ]}
        />
      </DetailsSection>
      <DetailsSection title="Обслуживание">
        <Descriptions
          column={1}
          items={[
            {
              key: 'status',
              label: 'Статус',
              children: <Tag color={status.color}>{status.label}</Tag>,
            },
            {
              key: 'installationDate',
              label: 'Дата установки',
              children: dateLabel(equipment.installationDate),
            },
            {
              key: 'lastServiceDate',
              label: 'Последнее обслуживание',
              children: dateLabel(equipment.lastServiceDate),
            },
            {
              key: 'nextServiceDate',
              label: 'Следующее обслуживание',
              children: dateLabel(equipment.nextServiceDate),
            },
            {
              key: 'interval',
              label: 'Интервал обслуживания, мес.',
              children: equipment.serviceIntervalMonths ?? '—',
            },
            {
              key: 'notes',
              label: 'Примечание',
              children: (
                <span
                  style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}
                >
                  {equipment.notes || '—'}
                </span>
              ),
            },
          ]}
        />
      </DetailsSection>
    </Flex>
  );
}
