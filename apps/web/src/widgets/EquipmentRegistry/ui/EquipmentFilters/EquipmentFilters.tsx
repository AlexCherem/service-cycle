import { Select } from 'antd';

import { equipmentServiceStatuses } from '@/entities/equipment';
import type { EquipmentServiceStatus } from '@/shared/api/generated/models';
import { SearchInput } from '@/shared/ui/SearchInput';

import styles from './EquipmentFilters.module.css';

type EquipmentFiltersProps = {
  search: string;
  status: EquipmentServiceStatus | undefined;
  onSearch: (value: string) => void;
  onStatusChange: (value: EquipmentServiceStatus | undefined) => void;
};

export function EquipmentFilters({
  search,
  status,
  onSearch,
  onStatusChange,
}: EquipmentFiltersProps) {
  return (
    <div className={styles.filters}>
      <SearchInput
        className={styles.search}
        aria-label="Поиск оборудования"
        placeholder="Оборудование или имя клиента"
        maxLength={120}
        searchValue={search}
        onSearch={onSearch}
      />
      <Select<EquipmentServiceStatus>
        className={styles.status}
        aria-label="Статус обслуживания оборудования"
        placeholder="Все сроки обслуживания"
        allowClear
        value={status}
        onChange={onStatusChange}
        options={Object.entries(equipmentServiceStatuses).map(
          ([value, { label }]) => ({ value, label }),
        )}
      />
    </div>
  );
}
