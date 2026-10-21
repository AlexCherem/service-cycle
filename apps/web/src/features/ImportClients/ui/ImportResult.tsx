import { Button, Descriptions, Result, Space } from 'antd';

import type { ImportResultDto } from '@/shared/api/generated/models';
import { ButtonLink } from '@/shared/ui/ButtonLink';

import styles from './ImportClients.module.css';

type ImportResultProps = { result: ImportResultDto; onRestart: () => void };

export function ImportResult({ result, onRestart }: ImportResultProps) {
  return (
    <div className={styles.container}>
      <Result
        status="success"
        title="Импорт завершён"
        subTitle={`Сохранено строк: ${result.importedRowCount}. Пропущено: ${result.skippedRowCount}.`}
        extra={
          <Space wrap>
            <ButtonLink href="/clients" type="primary">
              Перейти к клиентам
            </ButtonLink>
            <Button onClick={onRestart}>Импортировать другой файл</Button>
          </Space>
        }
      />
      <Descriptions
        column={{ xs: 1, sm: 2 }}
        items={[
          {
            key: 'createdClients',
            label: 'Создано клиентов',
            children: result.createdClientCount,
          },
          {
            key: 'updatedClients',
            label: 'Обновлено клиентов',
            children: result.updatedClientCount,
          },
          {
            key: 'createdEquipment',
            label: 'Создано оборудования',
            children: result.createdEquipmentCount,
          },
          {
            key: 'updatedEquipment',
            label: 'Обновлено оборудования',
            children: result.updatedEquipmentCount,
          },
        ]}
      />
    </div>
  );
}
