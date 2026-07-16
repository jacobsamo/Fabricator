import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "@tanstack/react-router";
import { useQueries, useQuery } from "@tanstack/react-query";
import { Archive, Search, Upload } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BackupStatsStrip } from "@/components/backups/backup-stats-strip";
import { ManageConfigsPanel } from "@/components/backups/manage-configs-panel";
import { SnapshotsTable } from "@/components/backups/snapshots-table";
import {
  backupConfigsQuery,
  backupJobQuery,
  backupSummaryQuery,
  snapshotsQuery,
  useDeleteBackupConfigMutation,
  useDeleteSnapshotMutation,
  useQuickBackupMutation,
  useRestoreSnapshotMutation,
  useRunBackupConfigMutation,
  useSaveBackupConfigMutation,
  useUploadWorldMutation,
} from "@/queries/backups";
import { queryClient } from "@/lib/query-client";
import { queryKeys } from "@/lib/query-keys";
import { backupsUiStoreActions, useBackupsUiStore } from "@/stores/backups-ui-store";
import type { BackupConfigPayload, QuickBackupPayload } from "@/api/backups";

export function BackupsPage() {
  const { serverId } = useParams({ from: "/app/server/$serverId" });
  const [{ data: configs = [], isLoading: configsLoading }, { data: snapshots = [], isLoading: snapshotsLoading }, { data: summary, isLoading: summaryLoading }] = useQueries({
    queries: [backupConfigsQuery(serverId), snapshotsQuery(serverId), backupSummaryQuery(serverId)],
  });
  const ui = useBackupsUiStore((state) => state);
  const [typeFilter, setTypeFilter] = useState("all");
  const [configFilter, setConfigFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [jobMeta, setJobMeta] = useState<Record<string, unknown> | null>(null);
  const [archiveResultBanner, setArchiveResultBanner] = useState<Record<string, unknown> | null>(null);
  const [quickBackup, setQuickBackup] = useState<QuickBackupPayload>({ storagePath: "", compress: true, flush: true, shutdown: false });
  const [worldFile, setWorldFile] = useState<File | null>(null);
  const [actionError, setActionError] = useState("");
  const abortUploadRef = useRef<(() => void) | null>(null);
  const activeJobId = ui.activeJobId;
  const job = useQuery(backupJobQuery(activeJobId));
  const saveConfig = useSaveBackupConfigMutation(serverId, ui.selectedConfigId);
  const runConfig = useRunBackupConfigMutation(serverId);
  const quickBackupMutation = useQuickBackupMutation(serverId);
  const restore = useRestoreSnapshotMutation(serverId);
  const deleteConfig = useDeleteBackupConfigMutation(serverId);
  const deleteSnapshot = useDeleteSnapshotMutation(serverId);
  const uploadWorld = useUploadWorldMutation(serverId);

  const activeJob = job.data ? { ...jobMeta, ...job.data } : jobMeta;

  useEffect(() => {
    if (!activeJobId || !job.data || job.data.active !== false) return;
    void queryClient.invalidateQueries({ queryKey: queryKeys.session.backups.configs(serverId) });
    void queryClient.invalidateQueries({ queryKey: queryKeys.session.backups.snapshots(serverId) });
    void queryClient.invalidateQueries({ queryKey: queryKeys.session.backups.summary(serverId) });
    const timer = window.setTimeout(() => {
      backupsUiStoreActions.setActiveJobId(null);
      setJobMeta(null);
    }, 1500);
    return () => window.clearTimeout(timer);
  }, [activeJobId, job.data, serverId]);

  const configsById = useMemo(() => new Map(configs.map((config) => [String(config.id), config])), [configs]);
  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return snapshots.filter((snapshot) => {
      if (typeFilter !== "all" && snapshot.type !== typeFilter) return false;
      if (configFilter === "__manual__" && snapshot.configId) return false;
      if (configFilter !== "all" && configFilter !== "__manual__" && snapshot.configId !== configFilter) return false;
      if (!needle) return true;
      return [snapshot.fileName, snapshot.id, snapshot.message].some((value) => typeof value === "string" && value.toLowerCase().includes(needle));
    });
  }, [snapshots, typeFilter, configFilter, search]);

  const defaultStoragePath = typeof summary?.defaultStoragePath === "string" ? summary.defaultStoragePath : "";

  async function startJob(kind: string, starter: Promise<{ job_id: string }>, meta: Record<string, unknown> = {}) {
    setActionError("");
    try {
      const result = await starter;
      if (!result.job_id) throw new Error(`${kind} did not return a job id`);
      setJobMeta({ id: result.job_id, kind, active: true, phase: "starting", ...meta });
      backupsUiStoreActions.setActiveJobId(result.job_id);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : `Failed to start ${kind}.`);
      throw err;
    }
  }

  async function saveConfigDraft(configId: string | null, payload: BackupConfigPayload) {
    await saveConfig.mutateAsync(payload);
    if (!configId) backupsUiStoreActions.selectConfig(null);
  }

  async function runQuickBackup() {
    await startJob("backup", quickBackupMutation.mutateAsync({
      ...quickBackup,
      storagePath: quickBackup.storagePath || defaultStoragePath,
    }));
    backupsUiStoreActions.setActiveDialog(null);
  }

  async function restoreSnapshot(mode: "in_place" | "reset") {
    if (!ui.selectedSnapshotId) return;
    await startJob("restore", restore.mutateAsync({ snapshotId: ui.selectedSnapshotId, mode }), { snapshotId: ui.selectedSnapshotId });
    backupsUiStoreActions.setActiveDialog(null);
    backupsUiStoreActions.selectSnapshot(null);
  }

  async function importWorld() {
    if (!worldFile) return;
    try {
      await startJob("world_import", uploadWorld.mutateAsync({
        file: worldFile,
        onProgress: backupsUiStoreActions.setUploadProgress,
        registerAbort: (abort) => { abortUploadRef.current = abort; },
      }));
      setWorldFile(null);
      backupsUiStoreActions.setActiveDialog(null);
      backupsUiStoreActions.setUploadProgress(null);
    } catch {
      // startJob already surfaced the actionable message.
      backupsUiStoreActions.setActiveDialog(null);
    } finally {
      abortUploadRef.current = null;
    }
  }

  return (
    <div className="grid gap-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Backups</h2>
          <p className="text-sm text-muted-foreground">Snapshots, schedules and restore points for this server.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => backupsUiStoreActions.setActiveDialog("manage-configs")}>Schedules</Button>
          <Button variant="outline" disabled={Boolean(activeJob?.active) || uploadWorld.isPending} onClick={() => backupsUiStoreActions.setActiveDialog("import-world")}><Upload className="size-4" />Import world</Button>
          <Button disabled={Boolean(activeJob?.active)} onClick={() => backupsUiStoreActions.setActiveDialog("quick-backup")}><Archive className="size-4" />Quick backup</Button>
        </div>
      </header>
      <BackupStatsStrip summary={summary} loading={summaryLoading} />
      {actionError ? <Alert variant="destructive"><AlertDescription>{actionError}</AlertDescription></Alert> : null}
      {activeJob ? <Alert><AlertDescription>Active {String(activeJob.kind || "backup")} job · {String(activeJob.phase || "starting")} {activeJob.active === false ? "(complete)" : "(polling...)"}</AlertDescription></Alert> : null}
      {archiveResultBanner ? (
        <Alert>
          <AlertTitle>{Number(archiveResultBanner.retained_files ?? 0) > 0 ? "Archive files retained on disk" : "Archive files removed from disk"}</AlertTitle>
          <AlertDescription>
            <ArchiveDeleteSummary result={archiveResultBanner} />
          </AlertDescription>
          <Button className="absolute right-2 top-2 h-7 px-2 text-xs" variant="ghost" onClick={() => setArchiveResultBanner(null)}>Dismiss</Button>
        </Alert>
      ) : null}
      <div className="flex flex-wrap gap-2 rounded-lg border border-border bg-card p-3">
        {["all", "backup", "safety", "restore", "import"].map((value) => <Button key={value} type="button" size="sm" variant={typeFilter === value ? "default" : "outline"} onClick={() => setTypeFilter(value)}>{value}</Button>)}
        <Select value={configFilter} onValueChange={(value) => { if (value) setConfigFilter(value); }}>
          <SelectTrigger size="sm" className="w-44 rounded-md">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="all">All configs</SelectItem>
              <SelectItem value="__manual__">Manual</SelectItem>
              {configs.map((config) => <SelectItem key={String(config.id)} value={String(config.id)}>{String(config.name || "(unnamed)")}</SelectItem>)}
            </SelectGroup>
          </SelectContent>
        </Select>
        <label className="ml-auto flex h-8 items-center gap-2 rounded-md border border-input bg-background px-2 text-sm">
          <Search className="size-3 text-muted-foreground" />
          <Input className="h-7 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search snapshots" />
        </label>
      </div>
      {ui.activeDialog === "manage-configs" ? (
        <ManageConfigsPanel
          configs={configs}
          snapshots={snapshots}
          selectedConfigId={ui.selectedConfigId}
          defaultStoragePath={defaultStoragePath}
          saving={saveConfig.isPending}
          runningConfigId={String(activeJob?.configId || "") || null}
          activeJob={activeJob}
          onSelect={backupsUiStoreActions.selectConfig}
          onCreate={() => backupsUiStoreActions.selectConfig(null)}
          onSave={saveConfigDraft}
          onRun={(configId) => void startJob("backup", runConfig.mutateAsync(configId), { configId }).catch(() => undefined)}
          onDelete={(config) => {
            backupsUiStoreActions.selectConfig(String(config.id));
            backupsUiStoreActions.setActiveDialog("delete-config");
          }}
        />
      ) : null}
      <SnapshotsTable
        snapshots={filtered}
        configsById={configsById}
        serverId={serverId}
        busySnapshotId={String(activeJob?.snapshotId || "") || null}
        loading={snapshotsLoading || configsLoading}
        onRestore={(snapshot) => {
          backupsUiStoreActions.selectSnapshot(String(snapshot.id));
          backupsUiStoreActions.setActiveDialog("restore");
        }}
        onDelete={(snapshot) => {
          backupsUiStoreActions.selectSnapshot(String(snapshot.id));
          backupsUiStoreActions.setActiveDialog("delete-snapshot");
        }}
      />
      {ui.activeDialog === "quick-backup" ? <Modal title="Quick backup" onClose={() => backupsUiStoreActions.setActiveDialog(null)}><QuickBackupForm value={quickBackup} onChange={setQuickBackup} defaultStoragePath={defaultStoragePath} disabled={quickBackupMutation.isPending} onSubmit={() => void runQuickBackup().catch(() => undefined)} /></Modal> : null}
      {ui.activeDialog === "restore" ? <Modal title="Restore snapshot" onClose={() => backupsUiStoreActions.setActiveDialog(null)}><div className="grid gap-3 text-sm"><p className="text-muted-foreground">Choose how to restore this snapshot.</p><Button onClick={() => void restoreSnapshot("in_place").catch(() => undefined)}>Restore in place</Button><Button variant="destructive" onClick={() => void restoreSnapshot("reset").catch(() => undefined)}>Reset world then restore</Button></div></Modal> : null}
      {ui.activeDialog === "delete-snapshot" ? <Modal title="Delete snapshot" onClose={() => backupsUiStoreActions.setActiveDialog(null)}><ConfirmBody action="Delete" pending={deleteSnapshot.isPending} onConfirm={async () => { if (ui.selectedSnapshotId) await deleteSnapshot.mutateAsync(ui.selectedSnapshotId); backupsUiStoreActions.setActiveDialog(null); }} /></Modal> : null}
      {ui.activeDialog === "delete-config" ? <Modal title="Delete backup config" onClose={() => backupsUiStoreActions.setActiveDialog(null)}><DeleteConfigBody pending={deleteConfig.isPending} onConfirm={async (purge) => { if (!ui.selectedConfigId) return; const config = configsById.get(ui.selectedConfigId); const result = await deleteConfig.mutateAsync({ configId: ui.selectedConfigId, purge }); if (result.retained_files || result.deleted_files) setArchiveResultBanner({ ...result, configName: config?.name }); backupsUiStoreActions.setActiveDialog(null); }} /></Modal> : null}
      {ui.activeDialog === "import-world" ? <Modal title="Import world" onClose={() => backupsUiStoreActions.setActiveDialog(null)}><div className="grid gap-3 text-sm"><p className="text-muted-foreground">Upload a zip, tar, or tar.gz archive to replace the active world.</p><label className="grid gap-1 text-xs font-semibold uppercase text-muted-foreground">World archive<Input type="file" onChange={(event) => setWorldFile(event.target.files?.[0] || null)} /></label>{ui.uploadProgress !== null ? <div className="grid gap-2">{ui.uploadProgress < 0 ? <p>Upload progress: working...</p> : <><p>Upload progress: {ui.uploadProgress}%</p><Progress value={ui.uploadProgress} /></>}</div> : null}<div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => abortUploadRef.current?.()} disabled={!uploadWorld.isPending}>Cancel upload</Button><Button disabled={!worldFile || uploadWorld.isPending || Boolean(activeJob?.active)} onClick={() => void importWorld()}>{uploadWorld.isPending ? "Uploading..." : "Import"}</Button></div></div></Modal> : null}
    </div>
  );
}

function ArchiveDeleteSummary({ result }: { result: Record<string, unknown> }) {
  const configName = String(result.configName ?? "this config");
  const retained = typeof result.retained_files === "number" ? result.retained_files : 0;
  const deleted = typeof result.deleted_files === "number" ? result.deleted_files : 0;
  if (retained > 0 && deleted > 0) {
    return <>{deleted} archive file{deleted === 1 ? " was" : "s were"} removed and {retained} archive file{retained === 1 ? " was" : "s were"} kept for {configName}.</>;
  }
  if (deleted > 0) {
    return <>{deleted} archive file{deleted === 1 ? " was" : "s were"} removed for {configName}.</>;
  }
  return <>{retained} archive file{retained === 1 ? " was" : "s were"} kept for {configName}.</>;
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return <Dialog open title={title} className="max-w-xl" onOpenChange={(open) => { if (!open) onClose(); }}><div className="px-4 py-4">{children}</div></Dialog>;
}

function QuickBackupForm({ value, onChange, defaultStoragePath, disabled, onSubmit }: { value: QuickBackupPayload; onChange: (value: QuickBackupPayload) => void; defaultStoragePath: string; disabled?: boolean; onSubmit: () => void }) {
  const next = value.storagePath || defaultStoragePath;
  return <div className="grid gap-3 text-sm"><Input value={next} onChange={(event) => onChange({ ...value, storagePath: event.target.value })} placeholder="/absolute/path/to/backups" />{(["compress", "flush", "shutdown"] as const).map((key) => <label key={key} className="flex gap-2"><Checkbox checked={value[key]} onCheckedChange={(checked) => onChange({ ...value, [key]: checked === true })} />{key}</label>)}<Button disabled={disabled} onClick={onSubmit}>Start quick backup</Button></div>;
}

function ConfirmBody({ action, pending, onConfirm }: { action: string; pending?: boolean; onConfirm: () => void }) {
  return <div className="grid gap-3 text-sm"><p className="text-muted-foreground">This cannot be undone.</p><Button variant="destructive" disabled={pending} onClick={onConfirm}>{pending ? "Working..." : action}</Button></div>;
}

function DeleteConfigBody({ pending, onConfirm }: { pending?: boolean; onConfirm: (purge: boolean) => void }) {
  const [purge, setPurge] = useState(false);
  return <div className="grid gap-3 text-sm"><p className="text-muted-foreground">Delete this backup config. Purging also removes owned archive files from disk.</p><label className="flex gap-2"><Checkbox checked={purge} onCheckedChange={(checked) => setPurge(checked === true)} />Purge archive files</label><Button variant="destructive" disabled={pending} onClick={() => onConfirm(purge)}>{pending ? "Deleting..." : "Delete config"}</Button></div>;
}
