import type { ReactNode } from 'react';

import { AuthContainer, AuthContent } from '@/widgets/AuthLayout';
import { Sidebar } from '@/widgets/Sidebar';

type AuthLayoutProps = {
  children: ReactNode;
};

export default function AuthRouteLayout({ children }: AuthLayoutProps) {
  return (
    <AuthContainer>
      <Sidebar navigation="auth" />
      <AuthContent>{children}</AuthContent>
    </AuthContainer>
  );
}
