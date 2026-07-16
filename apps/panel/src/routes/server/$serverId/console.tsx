import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import { ArrowDown, RefreshCcw } from "lucide-react";
import { toast } from "sonner";

import * as serversApi from "@/api/servers";
import { mergeLogLines, type LogLevel } from "@/components/server/log-utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { queryKeys } from "@/lib/query-keys";
import { getEffectiveStatus } from "@/lib/server-status";
import { serverLogsQuery, serverQuery } from "@/queries/servers";
import { cn } from "@/lib/utils";

const filters: LogLevel[] = ["ALL", "INFO", "WARN", "ERROR", "DEBUG"];

export function ConsolePage() {
  const { serverId } = useParams({ from: "/app/server/$serverId" });
  const queryClient = useQueryClient();
  const [activeFilter, setActiveFilter] = useState<LogLevel>("ALL");
  const [autoScroll, setAutoScroll] = useState(true);
  const [command, setCommand] = useState("");
  const terminalRef = useRef<HTMLDivElement | null>(null);

  const server = useQuery(serverQuery(serverId));
  const logs = useQuery(serverLogsQuery(serverId, 200));
  const status = getEffectiveStatus(server.data);
  const canSendCommand = status === "running";
  const allLines = useMemo(() => mergeLogLines(logs.data?.stdout, logs.data?.stderr), [logs.data]);
  const filteredLines = activeFilter === "ALL" ? allLines : allLines.filter((line) => line.level === activeFilter);

  const sendCommand = useMutation({
    mutationFn: (value: string) => serversApi.sendServerCommand(serverId, value),
    onSuccess: async () => {
      setCommand("");
      toast.success("Command sent");
      await queryClient.invalidateQueries({ queryKey: queryKeys.session.serverLogs(serverId, 200) });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Command failed"),
  });

  useEffect(() => {
    if (!autoScroll) return;
    const element = terminalRef.current;
    if (element) element.scrollTop = element.scrollHeight;
  }, [autoScroll, filteredLines.length]);

  return (
    <div className="flex min-h-[calc(100vh-9rem)] flex-1 flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-0.5 rounded-md border border-border bg-secondary p-0.5" role="group" aria-label="Log level filter">
          {filters.map((filter) => (
            <button
              key={filter}
              type="button"
              className={cn(
                "h-7 rounded px-3 text-xs font-medium text-muted-foreground transition hover:text-foreground",
                activeFilter === filter && "bg-accent text-foreground",
                activeFilter === filter && filter === "INFO" && "text-info",
                activeFilter === filter && filter === "WARN" && "text-warning",
                activeFilter === filter && filter === "ERROR" && "text-destructive",
                activeFilter === filter && filter === "DEBUG" && "text-primary",
              )}
              aria-pressed={activeFilter === filter}
              onClick={() => setActiveFilter(filter)}
            >
              {filter}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={autoScroll ? "outline" : "ghost"}
            size="icon"
            aria-label={autoScroll ? "Auto-scroll on" : "Auto-scroll off"}
            aria-pressed={autoScroll}
            onClick={() => setAutoScroll((value) => !value)}
          >
            <ArrowDown />
          </Button>
          <Button variant="ghost" size="sm" disabled={logs.isFetching} onClick={() => void logs.refetch()}>
            <RefreshCcw />
            Refresh
          </Button>
        </div>
      </div>

      <div ref={terminalRef} className="min-h-0 flex-1 overflow-y-auto rounded-lg border border-border bg-secondary p-3 font-mono text-xs text-muted-foreground">
        {filteredLines.length === 0 ? (
          <div className="py-8 text-center font-sans text-sm text-muted-foreground">
            {logs.isLoading ? "Loading logs..." : activeFilter === "ALL" ? "No logs yet." : `No ${activeFilter} entries.`}
          </div>
        ) : (
          filteredLines.map((line) => (
            <div key={line.id} className="flex items-baseline gap-2 py-px">
              {line.time ? <span className="min-w-14 shrink-0 text-muted-foreground/70">{line.time}</span> : null}
              <span className={cn("min-w-10 shrink-0 font-medium", line.level === "INFO" && "text-info", line.level === "WARN" && "text-warning", line.level === "ERROR" && "text-destructive", line.level === "DEBUG" && "text-primary")}>{line.level}</span>
              <span className="min-w-0 break-words text-secondary-foreground">{line.message}</span>
            </div>
          ))
        )}
      </div>

      <form
        className="flex items-center gap-2 rounded-lg border border-border bg-secondary px-3 py-2"
        onSubmit={(event) => {
          event.preventDefault();
          const next = command.trim();
          if (!next || !canSendCommand) return;
          sendCommand.mutate(next);
        }}
      >
        <span className="shrink-0 font-mono text-primary">&gt;</span>
        <Input
          className="min-w-0 flex-1 border-0 bg-transparent px-0 font-mono shadow-none focus-visible:ring-0"
          value={command}
          disabled={!canSendCommand || sendCommand.isPending}
          placeholder={canSendCommand ? "Type a command and press Enter..." : "Server not running"}
          onChange={(event) => setCommand(event.target.value)}
        />
        <Button type="submit" size="sm" disabled={!canSendCommand || !command.trim() || sendCommand.isPending}>
          Send
        </Button>
      </form>
    </div>
  );
}
