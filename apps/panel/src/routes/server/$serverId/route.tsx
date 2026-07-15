import { Outlet, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { Badge } from "@/components/ui/badge";
import { serverQuery } from "@/queries/servers";

export function ServerLayout() {
  const { serverId } = useParams({ from: "/app/server/$serverId" });
  const server = useQuery(serverQuery(serverId));

  return (
    <section className="flex min-h-0 flex-1 flex-col gap-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">{server.data?.name || "Server"}</h1>
          <p className="text-sm text-muted-foreground">Server route group: {serverId}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge>{server.data?.loader || "loader"}</Badge>
          <Badge variant="muted">{server.data?.status || "status"}</Badge>
        </div>
      </div>
      <Outlet />
    </section>
  );
}
