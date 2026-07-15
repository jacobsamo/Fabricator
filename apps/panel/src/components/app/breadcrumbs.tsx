import { Link, useRouterState } from "@tanstack/react-router";

import type { ServerSummary } from "@/api/schemas";

const ROUTE_LABELS: Record<string, string> = {
  overview: "Overview",
  console: "Console",
  players: "Players",
  mods: "Mods",
  files: "Files",
  backups: "Backups",
  playit: "playit.gg",
  properties: "Properties",
  settings: "Settings",
};

type AppBreadcrumbsProps = {
  server: ServerSummary | null | undefined;
};

export function AppBreadcrumbs({ server }: AppBreadcrumbsProps) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const segments = pathname.split("/").filter(Boolean);
  const current = segments.at(-1);
  const currentLabel = current ? ROUTE_LABELS[current] || "Servers" : "Servers";
  const serverId = segments[0] === "server" ? segments[1] : null;

  return (
    <nav className="flex min-w-0 items-center gap-1 text-sm" aria-label="Breadcrumb">
      <Link to="/" className="shrink-0 text-muted-foreground transition hover:text-foreground">
        Servers
      </Link>
      {serverId ? (
        <>
          <span className="text-muted-foreground/60">/</span>
          <Link
            to="/server/$serverId/overview"
            params={{ serverId }}
            className="max-w-44 truncate text-muted-foreground transition hover:text-foreground"
          >
            {server?.name || serverId}
          </Link>
          <span className="text-muted-foreground/60">/</span>
          <span className="truncate font-medium text-foreground">{currentLabel}</span>
        </>
      ) : (
        <>
          <span className="text-muted-foreground/60">/</span>
          <span className="truncate font-medium text-foreground">All servers</span>
        </>
      )}
    </nav>
  );
}
