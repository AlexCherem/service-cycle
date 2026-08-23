'use client';

import { type ReactNode, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import {
  BellOutlined,
  DashboardOutlined,
  FileTextOutlined,
  SettingOutlined,
  TeamOutlined,
  ToolOutlined,
} from '@ant-design/icons';
import { Layout, Menu } from 'antd';

import styles from './WorkspaceSidebar.module.css';

type NavigationItem = {
  key: string;
  icon: ReactNode;
  label: ReactNode;
  disabled?: boolean;
};

const navigationItems: NavigationItem[] = [
  {
    key: '/',
    icon: <DashboardOutlined />,
    label: <Link href="/">Обзор</Link>,
  },
  {
    key: '/clients',
    icon: <TeamOutlined />,
    label: <Link href="/clients">Клиенты</Link>,
  },
  {
    key: '/equipment',
    icon: <ToolOutlined />,
    label: 'Оборудование',
    disabled: true,
  },
  {
    key: '/service-cycles',
    icon: <ToolOutlined />,
    label: 'Обслуживание',
    disabled: true,
  },
  {
    key: '/notifications',
    icon: <BellOutlined />,
    label: 'Уведомления',
    disabled: true,
  },
  {
    key: '/responses',
    icon: <FileTextOutlined />,
    label: 'Заявки',
    disabled: true,
  },
  {
    key: '/settings',
    icon: <SettingOutlined />,
    label: 'Настройки',
    disabled: true,
  },
];

export function WorkspaceSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const selectedKey =
    navigationItems.find(({ key }) =>
      key === '/'
        ? pathname === '/'
        : pathname === key || pathname.startsWith(`${key}/`),
    )?.key ?? '/';

  return (
    <Layout.Sider
      className={styles.sidebar}
      collapsed={collapsed}
      collapsedWidth={72}
      collapsible
      onCollapse={setCollapsed}
      theme="dark"
      width={240}
    >
      <Link className={styles.brand} href="/">
        {collapsed ? 'SC' : 'Service Cycle'}
      </Link>

      <nav aria-label="Основная навигация">
        <Menu
          items={navigationItems}
          mode="inline"
          selectedKeys={[selectedKey]}
          theme="dark"
        />
      </nav>
    </Layout.Sider>
  );
}
