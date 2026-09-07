import type { ReactNode } from 'react';

import { AuthContainer, AuthContent } from '@/widgets/AuthLayout';
import { Sidebar } from '@/widgets/Sidebar';
import { SessionGuard } from '@/features/auth';

type AuthLayoutProps = {
  children: ReactNode;
};

export default function AuthRouteLayout({ children }: AuthLayoutProps) {
  return (
    <SessionGuard access="guest">
      <AuthContainer>
        <Sidebar navigation="auth" />
        <AuthContent>{children}</AuthContent>
      </AuthContainer>
    </SessionGuard>
  );
}
