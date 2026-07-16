import { Link, useRouterState } from "@tanstack/react-router";

import type { ServerSummary } from "@/api/schemas";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";

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
    <Breadcrumb className="min-w-0">
      <BreadcrumbList className="flex-nowrap">
        <BreadcrumbItem>
          <BreadcrumbLink render={<Link to="/" />} className="shrink-0">
            Servers
          </BreadcrumbLink>
        </BreadcrumbItem>
      {serverId ? (
        <>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link to="/server/$serverId/overview" params={{ serverId }} />} className="max-w-44 truncate">
              {server?.name || serverId}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="truncate font-medium">{currentLabel}</BreadcrumbPage>
          </BreadcrumbItem>
        </>
      ) : (
        <>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="truncate font-medium">All servers</BreadcrumbPage>
          </BreadcrumbItem>
        </>
      )}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
