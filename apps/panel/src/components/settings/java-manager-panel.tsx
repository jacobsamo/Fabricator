import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { queryKeys } from "@/lib/query-keys";
import { getInstalledJava, getJavaInstallProgress, installJava, uninstallJava } from "@/api/servers";

const INSTALLABLE_MAJORS = [8, 11, 17, 21, 25];

function formatMb(bytes: unknown) {
  if (typeof bytes !== "number" || !bytes) return "?";
  const mb = bytes / (1024 * 1024);
  return mb >= 100 ? `${Math.round(mb)} MB` : `${mb.toFixed(1)} MB`;
}

export function JavaManagerPanel() {
  const installed = useQuery({ queryKey: queryKeys.session.java.installed, queryFn: getInstalledJava });
  const [selectedMajor, setSelectedMajor] = useState(21);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [deleteMajor, setDeleteMajor] = useState<number | null>(null);
  const [actionError, setActionError] = useState("");
  const progress = useQuery({
    queryKey: taskId ? queryKeys.session.java.installProgress(taskId) : ["session", "java", "install-progress", "none"],
    queryFn: () => getJavaInstallProgress(taskId || ""),
    enabled: Boolean(taskId),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === "done" || status === "error" || status === "cancelled" ? false : 750;
    },
  });

  const data = installed.data || {};
  const managed = Array.isArray(data.managed) ? data.managed as Array<Record<string, unknown>> : [];
  const system = data.system && typeof data.system === "object" ? data.system as Record<string, unknown> : null;
  const installedMajors = useMemo(() => new Set(managed.map((entry) => entry.major).filter((major): major is number => typeof major === "number")), [managed]);
  const availableMajors = INSTALLABLE_MAJORS.filter((major) => !installedMajors.has(major));

  useEffect(() => {
    if (!availableMajors.includes(selectedMajor)) setSelectedMajor(availableMajors[0] ?? 21);
  }, [availableMajors, selectedMajor]);

  useEffect(() => {
    const status = progress.data?.status;
    if (status === "done" || status === "error" || status === "cancelled") {
      if (status === "done") void installed.refetch();
      if (status === "error") setActionError(String(progress.data?.error || "The Java install failed."));
      if (status === "cancelled") setActionError("Java install was cancelled.");
      window.setTimeout(() => setTaskId(null), 1000);
    }
  }, [progress.data?.status, installed]);

  const downloaded = typeof progress.data?.downloaded === "number" ? progress.data.downloaded : 0;
  const total = typeof progress.data?.total === "number" ? progress.data.total : 0;
  const pct = total ? Math.max(0, Math.min(100, Math.round((downloaded / total) * 100))) : 0;

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>Java</CardTitle>
        <Button type="button" variant="ghost" size="sm" onClick={() => void installed.refetch()} disabled={installed.isFetching || Boolean(taskId)}>Refresh</Button>
      </CardHeader>
      <CardContent className="grid gap-4">
        {installed.isLoading ? <p className="text-sm text-muted-foreground">Loading Java runtimes...</p> : null}
        {installed.error ? <p className="text-sm text-destructive">{installed.error.message}</p> : null}
        {actionError ? <p className="text-sm text-destructive" role="alert">{actionError}</p> : null}
        <ul className="grid gap-2">
          {system?.installed ? (
            <li className="flex justify-between gap-3 rounded-md border border-border bg-background p-3">
              <div className="min-w-0"><div className="text-sm font-medium">System Java {String(system.version || "")}</div><div className="truncate font-mono text-xs text-muted-foreground">On PATH ({String(system.path || "-")})</div></div>
              <span className="text-xs uppercase text-muted-foreground">System</span>
            </li>
          ) : null}
          {managed.map((entry) => (
            <li key={String(entry.major)} className="flex justify-between gap-3 rounded-md border border-border bg-background p-3">
              <div className="min-w-0"><div className="text-sm font-medium">Java {String(entry.major)}{entry.version && entry.version !== entry.major ? ` (reports ${String(entry.version)})` : ""}</div><div className="truncate font-mono text-xs text-muted-foreground">{String(entry.path || "-")}</div></div>
              <Button variant="destructive" size="sm" disabled={Boolean(taskId)} onClick={() => setDeleteMajor(typeof entry.major === "number" ? entry.major : null)}>Remove</Button>
            </li>
          ))}
          {!installed.isLoading && managed.length === 0 && !system?.installed ? <li className="text-sm text-muted-foreground">No Java runtimes installed yet.</li> : null}
        </ul>
        {taskId ? (
          <div className="grid gap-2">
            <div className="flex justify-between text-sm"><span>Installing Java</span><span className="text-muted-foreground">{progress.data?.status === "downloading" ? `Downloading ${formatMb(downloaded)} of ${formatMb(total)} (${pct}%)` : String(progress.data?.status || "Starting...")}</span></div>
            <Progress value={pct} />
            {progress.data?.error ? <p className="text-sm text-destructive">{String(progress.data.error)}</p> : null}
          </div>
        ) : (
          <div className="flex flex-wrap items-end gap-2 border-t border-border pt-4">
            <label className="grid gap-1 text-xs font-semibold uppercase text-muted-foreground">Add a Java runtime
              <Select value={String(selectedMajor)} onValueChange={(value) => { if (value) setSelectedMajor(Number(value)); }} disabled={availableMajors.length === 0}>
                <SelectTrigger className="h-9 min-w-40 rounded-md"><SelectValue placeholder="All common versions installed" /></SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {availableMajors.map((major) => <SelectItem key={major} value={String(major)}>Java {major}</SelectItem>)}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </label>
            <Button size="sm" disabled={availableMajors.length === 0} onClick={async () => { setActionError(""); try { const task = await installJava(selectedMajor); setTaskId(String(task.task_id)); } catch (err) { setActionError(err instanceof Error ? err.message : "Failed to start Java install."); } }}>Install</Button>
          </div>
        )}
        {deleteMajor !== null ? (
          <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3">
            <p className="text-sm">Remove Java {deleteMajor}? Servers that need it will prompt for reinstall next start.</p>
            <div className="mt-3 flex justify-end gap-2"><Button variant="ghost" size="sm" onClick={() => setDeleteMajor(null)}>Cancel</Button><Button variant="destructive" size="sm" onClick={async () => { setActionError(""); try { await uninstallJava(deleteMajor); setDeleteMajor(null); await installed.refetch(); } catch (err) { setActionError(err instanceof Error ? err.message : `Failed to remove Java ${deleteMajor}.`); } }}>Remove</Button></div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
