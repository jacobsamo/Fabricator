import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Archive,
  Boxes,
  FileText,
  Gauge,
  LayoutGrid,
  Lock,
  Network,
  Plus,
  Server,
  Settings,
  Terminal,
  Users,
} from "lucide-react";

import { ServerSwitcher } from "@/components/server/server-switcher";
import { UpdateStatus } from "@/components/app/update-status";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarSection } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { authStatusQuery, useLogoutMutation } from "@/queries/auth";
import { serverQuery } from "@/queries/servers";
import { isVanillaServer } from "@/lib/server-status";
import { appStoreActions } from "@/stores/app-store";

const navItems = [
  { to: "/server/$serverId/overview", label: "Overview", icon: LayoutGrid },
  { to: "/server/$serverId/console", label: "Console", icon: Terminal },
  { to: "/server/$serverId/players", label: "Players", icon: Users },
  { to: "/server/$serverId/mods", label: "Mods", icon: Boxes },
  { to: "/server/$serverId/files", label: "Files", icon: FileText },
  { to: "/server/$serverId/backups", label: "Backups", icon: Archive },
  { to: "/server/$serverId/playit", label: "playit.gg", icon: Network },
  { to: "/server/$serverId/properties", label: "Properties", icon: Gauge },
  { to: "/server/$serverId/settings", label: "Settings", icon: Settings },
] as const;

export function AppSidebar() {
  const navigate = useNavigate();
  const logout = useLogoutMutation();
  const auth = useQuery(authStatusQuery);
  const matches = useRouterState({ select: (state) => state.matches });
  const serverMatch = matches.find((match) => "serverId" in match.params);
  const serverParams = serverMatch?.params as { serverId?: unknown } | undefined;
  const serverId = typeof serverParams?.serverId === "string" ? serverParams.serverId : null;
  const server = useQuery({
    ...serverQuery(serverId || "__none__"),
    enabled: Boolean(serverId),
  });
  const visibleNavItems = isVanillaServer(server.data) ? navItems.filter((item) => item.label !== "Mods") : navItems;

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex size-8 items-center justify-center rounded-md bg-primary text-white">
          <Server aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold">Fabricator</div>
          <div className="truncate text-xs text-muted-foreground">Panel preview</div>
        </div>
      </SidebarHeader>

      <SidebarSection>
        {serverId ? (
          <ServerSwitcher serverId={serverId} currentServer={server.data} />
        ) : (
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-left text-sm transition hover:bg-accent"
            onClick={() => appStoreActions.setGlobalModal("create-server")}
          >
            <Plus className="size-3.5" />
            <span className="truncate">No servers yet</span>
          </button>
        )}
      </SidebarSection>

      <SidebarContent>
      <SidebarMenu aria-label="Server navigation">
        {visibleNavItems.map((item) => (
          serverId ? (
            <Link
              key={item.label}
              to={item.to}
              params={{ serverId }}
              className={cn(
                "flex h-9 items-center gap-2 rounded-md px-3 text-sm text-muted-foreground transition hover:bg-accent hover:text-accent-foreground",
                "[&.active]:bg-accent [&.active]:text-accent-foreground",
              )}
            >
              <item.icon aria-hidden="true" />
              <span className="truncate">{item.label}</span>
            </Link>
          ) : (
            <SidebarMenuItem
              key={item.label}
              aria-disabled="true"
            >
              <item.icon aria-hidden="true" />
              <span className="truncate">{item.label}</span>
            </SidebarMenuItem>
          )
        ))}
      </SidebarMenu>
      </SidebarContent>

      <SidebarFooter>
        <Link
          to="/"
          className="flex h-9 items-center gap-2 rounded-md px-3 text-sm text-muted-foreground transition hover:bg-accent hover:text-accent-foreground"
        >
          <Server aria-hidden="true" />
          <span className="truncate">All servers</span>
        </Link>
        {auth.data?.enabled ? (
          <button
            type="button"
            className="flex h-9 items-center gap-2 rounded-md px-3 text-left text-sm text-muted-foreground transition hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
            disabled={logout.isPending}
            onClick={async () => {
              await logout.mutateAsync();
              await navigate({ to: "/login", search: { redirect: undefined }, replace: true });
            }}
          >
            <Lock aria-hidden="true" />
            <span className="truncate">Lock</span>
          </button>
        ) : null}
        <UpdateStatus />
      </SidebarFooter>
    </Sidebar>
  );
}
