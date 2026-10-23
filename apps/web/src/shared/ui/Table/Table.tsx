'use client';

import type { TableProps as AntdTableProps } from 'antd';
import { Table as AntdTable } from 'antd';

export type TableProps<Row extends object> = AntdTableProps<Row>;

export function Table<Row extends object>({
  pagination,
  ...props
}: TableProps<Row>) {
  return (
    <AntdTable<Row>
      {...props}
      pagination={
        pagination === false
          ? false
          : {
              showSizeChanger: true,
              pageSizeOptions: [10, 20, 50, 100],
              showTotal: (total) => `Всего: ${total}`,
              ...pagination,
            }
      }
    />
  );
}
