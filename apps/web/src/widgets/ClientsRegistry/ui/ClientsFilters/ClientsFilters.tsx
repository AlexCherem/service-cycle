import { Select } from 'antd';

import type { EquipmentServiceStatus } from '@/shared/api/generated/models';
import { SearchInput } from '@/shared/ui/SearchInput';

import { equipmentServiceStatuses } from '../../config/equipmentServiceStatuses';

import styles from './ClientsFilters.module.css';

type ClientsFiltersProps = {
  status: EquipmentServiceStatus | undefined;
  onSearch: (value: string) => void;
  onStatusChange: (value: EquipmentServiceStatus | undefined) => void;
};

export function ClientsFilters({
  status,
  onSearch,
  onStatusChange,
}: ClientsFiltersProps) {
  return (
    <div className={styles.filters}>
      <div className={styles.search}>
        <SearchInput
          aria-label="Поиск клиента"
          placeholder="Имя или телефон"
          maxLength={120}
          onSearch={onSearch}
        />
      </div>
      <div className={styles.status}>
        <Select<EquipmentServiceStatus>
          aria-label="Статус обслуживания"
          placeholder="Все сроки обслуживания"
          allowClear
          value={status}
          onChange={onStatusChange}
          options={Object.entries(equipmentServiceStatuses).map(
            ([value, { label }]) => ({
              value,
              label,
            }),
          )}
        />
      </div>
    </div>
  );
}
