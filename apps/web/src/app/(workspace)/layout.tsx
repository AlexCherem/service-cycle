import { Sidebar } from '@/widgets/Sidebar';
import {
  WorkspaceContainer,
  WorkspaceContent,
  WorkspaceFooter,
  WorkspaceHeader,
} from '@/widgets/WorkspaceLayout';
import { SessionGuard } from '@/features/auth';

export default function WorkspaceRouteLayout({ children }: LayoutProps<'/'>) {
  return (
    <SessionGuard access="authenticated">
      <WorkspaceContainer>
        <Sidebar navigation="workspace" />
        <WorkspaceHeader />
        <WorkspaceContent>{children}</WorkspaceContent>
        <WorkspaceFooter />
      </WorkspaceContainer>
    </SessionGuard>
  );
}
