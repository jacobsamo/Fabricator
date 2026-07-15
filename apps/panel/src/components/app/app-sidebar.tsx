import { Link, useRouterState } from "@tanstack/react-router";
import {
  Archive,
  Boxes,
  FileText,
  Gauge,
  LayoutGrid,
  Network,
  Server,
  Settings,
  Terminal,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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
  const matches = useRouterState({ select: (state) => state.matches });
  const serverMatch = matches.find((match) => "serverId" in match.params);
  const serverParams = serverMatch?.params as { serverId?: unknown } | undefined;
  const serverId = typeof serverParams?.serverId === "string" ? serverParams.serverId : null;

  return (
    <aside className="flex h-screen w-[216px] shrink-0 flex-col border-r border-border bg-sidebar text-sidebar-foreground">
      <div className="flex h-[57px] items-center gap-3 border-b border-border px-4">
        <div className="flex size-8 items-center justify-center rounded-md bg-primary text-white">
          <Server aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold">Fabricator</div>
          <div className="truncate text-xs text-muted-foreground">Panel preview</div>
        </div>
      </div>

      <div className="border-b border-border p-3">
        <Link to="/" className="flex items-center justify-between rounded-md border border-border bg-card px-3 py-2 text-sm transition hover:bg-accent">
          <span className="truncate">All servers</span>
          <Badge variant="muted">new</Badge>
        </Link>
      </div>

      <nav className="flex flex-1 flex-col gap-1 p-3" aria-label="Server navigation">
        {navItems.map((item) => (
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
            <div
              key={item.label}
              aria-disabled="true"
              className="flex h-9 items-center gap-2 rounded-md px-3 text-sm text-muted-foreground/45"
            >
              <item.icon aria-hidden="true" />
              <span className="truncate">{item.label}</span>
            </div>
          )
        ))}
      </nav>

      <div className="border-t border-border p-3 text-xs text-muted-foreground">
        Built from `apps/panel`.
      </div>
    </aside>
  );
}
