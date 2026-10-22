import { Descriptions, Empty, Flex } from 'antd';

import type { ClientListItemDto } from '@/shared/api/generated/models';

import { ClientEquipmentCard } from '../ClientEquipmentCard/ClientEquipmentCard';

export function ClientDetails({ client }: { client: ClientListItemDto }) {
  return (
    <Flex vertical gap="large">
      <Flex component="section" vertical gap="middle">
        <h3 style={{ margin: 0 }}>Клиент</h3>
        <Descriptions
          column={1}
          items={[
            { key: 'name', label: 'Имя', children: client.name },
            { key: 'phone', label: 'Телефон', children: client.phone || '—' },
            { key: 'email', label: 'Email', children: client.email || '—' },
            {
              key: 'notes',
              label: 'Примечание',
              children: (
                <span
                  style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}
                >
                  {client.notes || '—'}
                </span>
              ),
            },
          ]}
        />
      </Flex>
      <Flex component="section" vertical gap="middle">
        <h3 style={{ margin: 0 }}>Оборудование клиента</h3>
        {client.equipment.length ? (
          <Flex vertical gap="middle">
            {client.equipment.map((equipment) => (
              <ClientEquipmentCard key={equipment.id} equipment={equipment} />
            ))}
          </Flex>
        ) : (
          <Empty description="Оборудование не добавлено" />
        )}
      </Flex>
    </Flex>
  );
}
