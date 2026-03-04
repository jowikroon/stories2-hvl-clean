import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { WorkspaceProvider } from "@/hooks/use-workspace";
import AppSidebar from "@/components/app/AppSidebar";
import WorkspaceSwitcher from "@/components/app/WorkspaceSwitcher";
import UserMenu from "@/components/app/UserMenu";
import CommandPalette from "@/components/app/CommandPalette";
import { Link } from "react-router-dom";

export default function AppShell() {
  return (
    <WorkspaceProvider>
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AppSidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <header className="h-14 border-b border-border flex items-center gap-3 px-4">
              <SidebarTrigger className="text-muted-foreground" />
              <Link to="/" className="text-sm font-bold tracking-tight mr-2">
                marketplace<span className="text-gradient">growth</span>.nl
              </Link>
              <div className="h-5 w-px bg-border" />
              <WorkspaceSwitcher />
              <div className="ml-auto">
                <UserMenu />
              </div>
            </header>
            <main className="flex-1 overflow-auto p-6">
              <Outlet />
            </main>
            <CommandPalette />
          </div>
        </div>
      </SidebarProvider>
    </WorkspaceProvider>
  );
}
