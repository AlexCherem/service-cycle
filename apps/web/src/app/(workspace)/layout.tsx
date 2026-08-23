import {
  WorkspaceContainer,
  WorkspaceContent,
  WorkspaceFooter,
  WorkspaceHeader,
  WorkspaceSidebar,
} from '@/widgets/WorkspaceLayout';

export default function WorkspaceRouteLayout({ children }: LayoutProps<'/'>) {
  return (
    <WorkspaceContainer>
      <WorkspaceSidebar />
      <WorkspaceHeader />
      <WorkspaceContent>{children}</WorkspaceContent>
      <WorkspaceFooter />
    </WorkspaceContainer>
  );
}
