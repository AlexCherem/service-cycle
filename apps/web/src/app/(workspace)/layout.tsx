import { Sidebar } from '@/widgets/Sidebar';
import {
  WorkspaceContainer,
  WorkspaceContent,
  WorkspaceFooter,
  WorkspaceHeader,
} from '@/widgets/WorkspaceLayout';
import { RequireAuth } from '@/features/auth';

export default function WorkspaceRouteLayout({ children }: LayoutProps<'/'>) {
  return (
    <RequireAuth>
      <WorkspaceContainer>
        <Sidebar navigation="workspace" />
        <WorkspaceHeader />
        <WorkspaceContent>{children}</WorkspaceContent>
        <WorkspaceFooter />
      </WorkspaceContainer>
    </RequireAuth>
  );
}
