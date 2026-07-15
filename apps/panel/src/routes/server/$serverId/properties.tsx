import { useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { ServerPropertiesForm } from "@/forms/server-properties-form";
import { effectiveServerStatus } from "@/lib/server-settings";
import { serverQuery } from "@/queries/servers";

export function PropertiesPage() {
  const { serverId } = useParams({ from: "/app/server/$serverId" });
  const server = useQuery(serverQuery(serverId));
  if (server.isLoading) return <div className="text-sm text-muted-foreground">Loading settings...</div>;
  if (server.error) return <div className="text-sm text-destructive">{server.error.message}</div>;
  if (!server.data) return <div className="text-sm text-muted-foreground">No server loaded.</div>;
  return <ServerPropertiesForm server={server.data} canEdit={effectiveServerStatus(server.data) !== "running"} />;
}
