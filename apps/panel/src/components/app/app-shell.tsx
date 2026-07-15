import { Outlet } from "@tanstack/react-router";

import { AppSidebar } from "@/components/app/app-sidebar";
import { AppTopbar } from "@/components/app/app-topbar";

export function AppShell() {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <AppSidebar />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <AppTopbar />
        <main className="flex min-h-0 flex-1 flex-col overflow-y-auto p-5">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
