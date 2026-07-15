import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouterState } from "@tanstack/react-router";
import { Command, Play, RefreshCcw, RotateCw, Square } from "lucide-react";
import { toast } from "sonner";

import * as serversApi from "@/api/servers";
import { AppBreadcrumbs } from "@/components/app/breadcrumbs";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/ui/status-pill";
import { getEffectiveStatus, getServerMeta, getStatusLabel } from "@/lib/server-status";
import { appStoreActions } from "@/stores/app-store";
import { queryKeys } from "@/lib/query-keys";
import { serverQuery } from "@/queries/servers";

export function AppTopbar() {
  const queryClient = useQueryClient();
  const matches = useRouterState({ select: (state) => state.matches });
  const serverMatch = matches.find((match) => "serverId" in match.params);
  const serverParams = serverMatch?.params as { serverId?: unknown } | undefined;
  const serverId = typeof serverParams?.serverId === "string" ? serverParams.serverId : null;
  const server = useQuery({
    ...serverQuery(serverId || "__none__"),
    enabled: Boolean(serverId),
  });
  const status = getEffectiveStatus(server.data, "unknown");
  const isRunning = status === "running";
  const startLocked = status === "installing" || status === "pending";
  const startLabel = status === "installing" ? "Installing..." : status === "pending" ? "Install Required" : "Start";

  const action = useMutation({
    mutationFn: async (nextAction: "start" | "stop" | "restart") => {
      if (!serverId) return null;
      if (nextAction === "start") return serversApi.startServer(serverId);
      if (nextAction === "stop") return serversApi.stopServer(serverId);
      return serversApi.restartServer(serverId);
    },
    onSuccess: async (result, nextAction) => {
      if (result && "success" in result && result.success === false) {
        toast.error(String(result.message || "Operation failed"), { description: "Server Error" });
      } else {
        const message = nextAction === "start" ? "Server start requested" : nextAction === "stop" ? "Server stop requested" : "Server restart requested";
        toast.success(message, { description: "Server Updated" });
      }
      if (serverId) {
        await queryClient.invalidateQueries({ queryKey: queryKeys.session.server(serverId) });
      }
      await queryClient.invalidateQueries({ queryKey: queryKeys.session.servers });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Server action failed", { description: "Server Error" });
    },
  });

  const refreshVisibleData = async () => {
    if (serverId) {
      await queryClient.invalidateQueries({ queryKey: queryKeys.session.server(serverId) });
    }
    await queryClient.invalidateQueries({ queryKey: queryKeys.session.servers });
  };

  return (
    <header className="flex h-[57px] shrink-0 items-center justify-between border-b border-border bg-background/95 px-5">
      <div className="flex min-w-0 flex-col gap-0.5">
        <AppBreadcrumbs server={server.data} />
        {serverId ? <div className="truncate text-xs text-muted-foreground">{getServerMeta(server.data)}</div> : null}
      </div>
      <div className="flex items-center gap-2">
        {serverId ? (
          <>
            <StatusPill status={status} label={getStatusLabel(status)} sub={server.data?.loader && server.data?.version ? `${server.data.loader} ${server.data.version}` : server.data?.loader} />
            <Button
              variant="ghost"
              size="sm"
              disabled={action.isPending || !isRunning}
              onClick={() => action.mutate("restart")}
            >
              <RotateCw data-icon="inline-start" />
              {action.isPending && action.variables === "restart" ? "Restarting" : "Restart"}
            </Button>
            {isRunning ? (
              <Button
                variant="destructive"
                size="sm"
                disabled={action.isPending}
                onClick={() => action.mutate("stop")}
              >
                <Square data-icon="inline-start" />
                {action.isPending && action.variables === "stop" ? "Stopping" : "Stop"}
              </Button>
            ) : (
              <Button
                size="sm"
                disabled={action.isPending || startLocked}
                onClick={() => action.mutate("start")}
              >
                <Play data-icon="inline-start" />
                {action.isPending && action.variables === "start" ? "Starting..." : startLabel}
              </Button>
            )}
          </>
        ) : null}
        <Button variant="outline" size="sm" onClick={() => appStoreActions.setCommandPaletteOpen(true)}>
          <Command data-icon="inline-start" />
          Command
        </Button>
        <Button variant="ghost" size="icon" aria-label="Refresh visible data" onClick={() => void refreshVisibleData()}>
          <RefreshCcw />
        </Button>
      </div>
    </header>
  );
}
