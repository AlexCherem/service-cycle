'use client';

import { CloseOutlined } from '@ant-design/icons';
import type { DrawerProps } from 'antd';
import { Button, Drawer, Space } from 'antd';

export type RightPanelProps = Omit<
  DrawerProps,
  'placement' | 'closable' | 'closeIcon'
> & {
  showCloseButton?: boolean;
};

export function RightPanel({
  size = 640,
  destroyOnHidden = true,
  push = false,
  extra,
  onClose,
  showCloseButton = true,
  ...props
}: RightPanelProps) {
  return (
    <Drawer
      {...props}
      placement="right"
      size={size}
      destroyOnHidden={destroyOnHidden}
      push={push}
      onClose={onClose}
      closable={false}
      extra={
        extra || (showCloseButton && onClose) ? (
          <Space wrap>
            {showCloseButton && onClose && (
              <Button icon={<CloseOutlined />} onClick={onClose}>
                Закрыть
              </Button>
            )}
            {extra}
          </Space>
        ) : null
      }
    />
  );
}
