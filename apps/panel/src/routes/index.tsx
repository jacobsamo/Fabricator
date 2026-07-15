import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { Plus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { serversQuery } from "@/queries/servers";

export function ServerListPage() {
  const navigate = useNavigate();
  const servers = useQuery(serversQuery);

  useEffect(() => {
    const firstServer = servers.data?.[0];
    if (firstServer) {
      void navigate({
        to: "/server/$serverId/overview",
        params: { serverId: firstServer.id },
        replace: true,
      });
    }
  }, [navigate, servers.data]);

  return (
    <section className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Servers</h1>
          <p className="text-sm text-muted-foreground">Current Vue server list parity target.</p>
        </div>
        <Button>
          <Plus data-icon="inline-start" />
          Create server
        </Button>
      </div>

      {servers.isError ? (
        <Card>
          <CardHeader>
            <CardTitle>Unable to load servers</CardTitle>
            <CardDescription>{servers.error instanceof Error ? servers.error.message : "Refresh to try again."}</CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {(servers.data || []).map((server) => (
          <Link key={server.id} to="/server/$serverId/overview" params={{ serverId: server.id }}>
            <Card className="transition hover:border-primary/50">
              <CardHeader>
                <CardTitle>{server.name}</CardTitle>
                <CardDescription>{server.version || "Version unknown"}</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center gap-2">
                <Badge>{server.loader || "loader"}</Badge>
                <Badge variant="muted">{server.status || "unknown"}</Badge>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {!servers.isLoading && !servers.data?.length ? (
        <Card>
          <CardHeader>
            <CardTitle>No servers yet</CardTitle>
            <CardDescription>The panel scaffold is ready for the create-server flow.</CardDescription>
          </CardHeader>
        </Card>
      ) : null}
    </section>
  );
}
