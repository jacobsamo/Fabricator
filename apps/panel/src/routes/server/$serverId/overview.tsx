import { Link, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";

import { LogViewer } from "@/components/server/log-viewer";
import { mergeLogLines } from "@/components/server/log-utils";
import { ServerPanel } from "@/components/server/server-panel";
import { StatCard } from "@/components/server/stat-card";
import { buttonVariants } from "@/components/ui/button";
import { getEffectiveStatus } from "@/lib/server-status";
import { installedModsQuery, serverLogsQuery, serverQuery } from "@/queries/servers";

const recentLogPreviewLines = 16;

function runtimeOf(server: unknown) {
  return (server as { runtime?: Record<string, unknown> } | undefined)?.runtime ?? {};
}

function modpackOf(server: unknown) {
  return (server as { modpack?: { name?: string; projectId?: string; version?: string } } | undefined)?.modpack ?? null;
}

function memoryOf(server: unknown) {
  const runtime = runtimeOf(server);
  const ram = runtime.ram as { limitGB?: number; usedGB?: number; usedBytes?: number; used?: number } | undefined;
  const configured = Number((server as { memory?: number } | undefined)?.memory ?? 0);
  const total = Number.isFinite(ram?.limitGB) && ram?.limitGB ? ram.limitGB : configured || 1;
  const used =
    typeof ram?.usedGB === "number" ? ram.usedGB :
    typeof ram?.usedBytes === "number" ? ram.usedBytes / 1024 ** 3 :
    typeof ram?.used === "number" ? ram.used :
    0;
  return { used: Math.max(0, Math.min(used, total)), total };
}

function modName(mod: { name?: string; relativePath?: string; path?: string }) {
  return mod.name || mod.relativePath?.split("/").pop() || mod.path?.split("/").pop() || "Mod";
}

export function OverviewPage() {
  const { serverId } = useParams({ from: "/app/server/$serverId" });
  const server = useQuery(serverQuery(serverId));
  const logs = useQuery(serverLogsQuery(serverId, 200));
  const mods = useQuery(installedModsQuery(serverId));

  const runtime = runtimeOf(server.data);
  const players = runtime.players as { online?: number; max?: number } | undefined;
  const memory = memoryOf(server.data);
  const ramPercent = memory.total > 0 ? Math.round((memory.used / memory.total) * 100) : 0;
  const cpuPercent = typeof runtime.cpu === "number" ? Math.min(100, Math.round(runtime.cpu)) : null;
  const status = getEffectiveStatus(server.data);
  const activeModpack = modpackOf(server.data);
  const allLines = mergeLogLines(logs.data?.stdout, logs.data?.stderr).slice(-recentLogPreviewLines);
  const modPreview = (mods.data ?? []).slice(0, 4);

  return (
    <div className="flex flex-col gap-4">
      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Players" value={players?.online ?? 0} unit={players?.max ? `/${players.max}` : ""} />
        <StatCard label="Uptime" value={String(runtime.uptime ?? "-")} />
        <StatCard label="Version" value={server.data?.version || "-"} />
        <StatCard label="Mods" value={mods.data?.length ?? 0} accent={(mods.data?.length ?? 0) > 0} />
      </section>

      {activeModpack ? (
        <ServerPanel title="Active modpack">
          <div className="flex items-baseline gap-3">
            <span className="text-sm font-medium">{activeModpack.name || activeModpack.projectId}</span>
            <span className="text-xs text-muted-foreground">{activeModpack.version || "unknown version"}</span>
          </div>
        </ServerPanel>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-2">
        <div className="flex flex-col gap-4">
          <ServerPanel title="Performance">
            <div className="flex flex-col gap-4">
              <div>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">RAM</span>
                  <span>{memory.used.toFixed(1)} / {memory.total.toFixed(1)} GB <span className="text-muted-foreground">{ramPercent}%</span></span>
                </div>
                <div className="h-2 overflow-hidden rounded bg-secondary">
                  <div className="h-full bg-primary" style={{ width: `${ramPercent}%` }} />
                </div>
              </div>
              <div>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">CPU</span>
                  <span>{cpuPercent === null ? "-" : `${cpuPercent}%`}</span>
                </div>
                <div className="h-2 overflow-hidden rounded bg-secondary">
                  <div className="h-full bg-info" style={{ width: `${cpuPercent ?? 0}%` }} />
                </div>
              </div>
            </div>
          </ServerPanel>

          <ServerPanel
            title="Recent logs"
            action={<Link to="/server/$serverId/console" params={{ serverId }} className={buttonVariants({ variant: "ghost", size: "sm" })}>Console <ArrowRight /></Link>}
          >
            <LogViewer lines={allLines} empty={logs.isLoading ? "Loading logs..." : "No logs yet."} className="max-h-72 overflow-y-auto" />
          </ServerPanel>
        </div>

        <div className="flex flex-col gap-4">
          <ServerPanel
            title="Installed mods"
            action={<Link to="/server/$serverId/mods" params={{ serverId }} className={buttonVariants({ variant: "ghost", size: "sm" })}>Manage <ArrowRight /></Link>}
          >
            {modPreview.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">{mods.isLoading ? "Loading mods..." : "No mods installed."}</div>
            ) : (
              <ul className="flex flex-col divide-y divide-border">
                {modPreview.map((mod) => (
                  <li key={mod.path || mod.relativePath || mod.name} className="flex items-center justify-between gap-3 py-2 text-sm">
                    <span className="min-w-0 truncate">{modName(mod)}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">{typeof mod.size === "number" ? `${Math.round(mod.size / 1024)} KB` : "local"}</span>
                  </li>
                ))}
              </ul>
            )}
          </ServerPanel>

          <ServerPanel title="Quick actions">
            <div className="grid gap-2 sm:grid-cols-2">
              {[
                ["Backups", "Manage snapshots", "/server/$serverId/backups"],
                ["Console", "View logs", "/server/$serverId/console"],
                ["Properties", "server.properties", "/server/$serverId/properties"],
                ["Files", "Browse server files", "/server/$serverId/files"],
              ].map(([title, subtitle, to]) => (
                <Link
                  key={title}
                  to={to}
                  params={{ serverId }}
                  className="rounded-md border border-border bg-secondary p-3 transition hover:border-primary/50 hover:bg-accent"
                >
                  <div className="text-sm font-medium">{title}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{subtitle}</div>
                </Link>
              ))}
            </div>
            {status === "pending" ? <p className="mt-3 text-xs text-warning">This server still needs installation before it can run.</p> : null}
          </ServerPanel>
        </div>
      </section>
    </div>
  );
}
