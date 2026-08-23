import type { Metadata } from 'next';

import { AppProviders } from '@/app/providers';

import './styles/global.css';

export const metadata: Metadata = {
  title: 'Service Cycle',
  description: 'Возвращаем клиентов на плановое обслуживание оборудования',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="ru">
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
