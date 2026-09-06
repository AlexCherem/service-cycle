'use client';

import { type ReactNode, useState } from 'react';

import { AntdRegistry } from '@ant-design/nextjs-registry';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider } from 'antd';

import { antdTheme } from '@/shared/config/antd';

type AppProvidersProps = {
  children: ReactNode;
};

export function AppProviders({ children }: AppProvidersProps) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <AntdRegistry>
      <QueryClientProvider client={queryClient}>
        <ConfigProvider theme={antdTheme}>{children}</ConfigProvider>
      </QueryClientProvider>
    </AntdRegistry>
  );
}
