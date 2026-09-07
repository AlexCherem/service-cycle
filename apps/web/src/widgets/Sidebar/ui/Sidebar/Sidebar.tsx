'use client';

import { type ReactNode, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import {
  BellOutlined,
  DashboardOutlined,
  FileTextOutlined,
  LoginOutlined,
  QuestionCircleOutlined,
  SettingOutlined,
  TeamOutlined,
  ToolOutlined,
  UserAddOutlined,
} from '@ant-design/icons';
import { Layout, Menu } from 'antd';

import styles from './Sidebar.module.css';

type Navigation = 'auth' | 'workspace';

type NavigationItem = {
  key: string;
  icon: ReactNode;
  label: ReactNode;
  disabled?: boolean;
};

type SidebarProps = {
  navigation: Navigation;
};

const authNavigationItems: NavigationItem[] = [
  {
    key: '/register',
    icon: <UserAddOutlined />,
    label: <Link href="/register">Регистрация</Link>,
  },
  {
    key: '/login',
    icon: <LoginOutlined />,
    label: <Link href="/login">Вход</Link>,
  },
  {
    key: '/support',
    icon: <QuestionCircleOutlined />,
    label: 'Поддержка',
    disabled: true,
  },
];

const workspaceNavigationItems: NavigationItem[] = [
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

const navigationItems: Record<Navigation, NavigationItem[]> = {
  auth: authNavigationItems,
  workspace: workspaceNavigationItems,
};

export function Sidebar({ navigation }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [responsiveCollapsed, setResponsiveCollapsed] = useState(false);
  const items = navigationItems[navigation];
  const isCollapsed = collapsed || responsiveCollapsed;
  const brandLabel = isCollapsed ? 'SC' : 'Service Cycle';

  const selectedKey =
    items.find(({ key }) =>
      key === '/'
        ? pathname === '/'
        : pathname === key || pathname.startsWith(`${key}/`),
    )?.key ?? '';

  return (
    <Layout.Sider
      breakpoint="md"
      className={styles.sidebar}
      collapsed={isCollapsed}
      collapsedWidth={72}
      collapsible
      onBreakpoint={setResponsiveCollapsed}
      onCollapse={(nextCollapsed, type) => {
        if (type === 'clickTrigger') {
          setCollapsed(nextCollapsed);
        }
      }}
      theme="dark"
      width={240}
    >
      {navigation === 'workspace' ? (
        <Link className={styles.brand} href="/">
          {brandLabel}
        </Link>
      ) : (
        <span className={styles.brand}>{brandLabel}</span>
      )}

      <nav aria-label="Основная навигация">
        <Menu
          items={items}
          mode="inline"
          selectedKeys={selectedKey ? [selectedKey] : []}
          theme="dark"
        />
      </nav>
    </Layout.Sider>
  );
}
