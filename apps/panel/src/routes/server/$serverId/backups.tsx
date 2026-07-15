import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "@tanstack/react-router";
import { useQueries, useQuery } from "@tanstack/react-query";
import { Archive, Search, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
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
  const [retainedBanner, setRetainedBanner] = useState<Record<string, unknown> | null>(null);
  const [quickBackup, setQuickBackup] = useState<QuickBackupPayload>({ storagePath: "", compress: true, flush: true, shutdown: false });
  const [worldFile, setWorldFile] = useState<File | null>(null);
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
    const result = await starter;
    setJobMeta({ id: result.job_id, kind, active: true, phase: "starting", ...meta });
    backupsUiStoreActions.setActiveJobId(result.job_id);
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
    await startJob("world_import", uploadWorld.mutateAsync({
      file: worldFile,
      onProgress: backupsUiStoreActions.setUploadProgress,
      registerAbort: (abort) => { abortUploadRef.current = abort; },
    }));
    setWorldFile(null);
    backupsUiStoreActions.setUploadProgress(null);
    backupsUiStoreActions.setActiveDialog(null);
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
      {activeJob ? <div className="rounded-md border border-primary/50 bg-primary/10 p-3 text-sm">Active {String(activeJob.kind || "backup")} job · {String(activeJob.phase || "starting")} {activeJob.active === false ? "(complete)" : "(polling...)"}</div> : null}
      {retainedBanner ? (
        <div className="rounded-md border border-border bg-card p-3 text-sm">
          <div className="flex justify-between gap-3"><strong>Archive files retained on disk</strong><button className="text-muted-foreground" onClick={() => setRetainedBanner(null)}>Dismiss</button></div>
          <p className="mt-1 text-muted-foreground">{String(retainedBanner.retained_files ?? 0)} archive files were kept for {String(retainedBanner.configName ?? "this config")}.</p>
        </div>
      ) : null}
      <div className="flex flex-wrap gap-2 rounded-lg border border-border bg-card p-3">
        {["all", "backup", "safety", "restore", "import"].map((value) => <Button key={value} type="button" size="sm" variant={typeFilter === value ? "default" : "outline"} onClick={() => setTypeFilter(value)}>{value}</Button>)}
        <select className="h-8 rounded-md border border-input bg-background px-2 text-sm" value={configFilter} onChange={(event) => setConfigFilter(event.target.value)}>
          <option value="all">All configs</option>
          <option value="__manual__">Manual</option>
          {configs.map((config) => <option key={String(config.id)} value={String(config.id)}>{String(config.name || "(unnamed)")}</option>)}
        </select>
        <label className="ml-auto flex h-8 items-center gap-2 rounded-md border border-input bg-background px-2 text-sm">
          <Search className="size-3 text-muted-foreground" />
          <input className="bg-transparent outline-none" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search snapshots" />
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
          onRun={(configId) => void startJob("backup", runConfig.mutateAsync(configId), { configId })}
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
      {ui.activeDialog === "quick-backup" ? <Modal title="Quick backup" onClose={() => backupsUiStoreActions.setActiveDialog(null)}><QuickBackupForm value={quickBackup} onChange={setQuickBackup} defaultStoragePath={defaultStoragePath} disabled={quickBackupMutation.isPending} onSubmit={runQuickBackup} /></Modal> : null}
      {ui.activeDialog === "restore" ? <Modal title="Restore snapshot" onClose={() => backupsUiStoreActions.setActiveDialog(null)}><div className="grid gap-3 text-sm"><p className="text-muted-foreground">Choose how to restore this snapshot.</p><Button onClick={() => void restoreSnapshot("in_place")}>Restore in place</Button><Button variant="destructive" onClick={() => void restoreSnapshot("reset")}>Reset world then restore</Button></div></Modal> : null}
      {ui.activeDialog === "delete-snapshot" ? <Modal title="Delete snapshot" onClose={() => backupsUiStoreActions.setActiveDialog(null)}><ConfirmBody action="Delete" pending={deleteSnapshot.isPending} onConfirm={async () => { if (ui.selectedSnapshotId) await deleteSnapshot.mutateAsync(ui.selectedSnapshotId); backupsUiStoreActions.setActiveDialog(null); }} /></Modal> : null}
      {ui.activeDialog === "delete-config" ? <Modal title="Delete backup config" onClose={() => backupsUiStoreActions.setActiveDialog(null)}><DeleteConfigBody pending={deleteConfig.isPending} onConfirm={async (purge) => { if (!ui.selectedConfigId) return; const config = configsById.get(ui.selectedConfigId); const result = await deleteConfig.mutateAsync({ configId: ui.selectedConfigId, purge }); if (result.retained_files) setRetainedBanner({ ...result, configName: config?.name }); backupsUiStoreActions.setActiveDialog(null); }} /></Modal> : null}
      {ui.activeDialog === "import-world" ? <Modal title="Import world" onClose={() => backupsUiStoreActions.setActiveDialog(null)}><div className="grid gap-3 text-sm"><p className="text-muted-foreground">Upload a zip, tar, or tar.gz archive to replace the active world.</p><input type="file" onChange={(event) => setWorldFile(event.target.files?.[0] || null)} />{ui.uploadProgress !== null ? <p>Upload progress: {ui.uploadProgress < 0 ? "working..." : `${ui.uploadProgress}%`}</p> : null}<div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => abortUploadRef.current?.()} disabled={!uploadWorld.isPending}>Cancel upload</Button><Button disabled={!worldFile || uploadWorld.isPending || Boolean(activeJob?.active)} onClick={() => void importWorld()}>{uploadWorld.isPending ? "Uploading..." : "Import"}</Button></div></div></Modal> : null}
    </div>
  );
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" onClick={onClose}><div className="w-full max-w-xl rounded-lg border border-border bg-card p-5 shadow-xl" onClick={(event) => event.stopPropagation()}><div className="mb-4 flex items-center justify-between gap-3"><h3 className="text-base font-semibold">{title}</h3><button className="text-muted-foreground" onClick={onClose}>Close</button></div>{children}</div></div>;
}

function QuickBackupForm({ value, onChange, defaultStoragePath, disabled, onSubmit }: { value: QuickBackupPayload; onChange: (value: QuickBackupPayload) => void; defaultStoragePath: string; disabled?: boolean; onSubmit: () => void }) {
  const next = value.storagePath || defaultStoragePath;
  return <div className="grid gap-3 text-sm"><input className="h-10 rounded-md border border-input bg-background px-3" value={next} onChange={(event) => onChange({ ...value, storagePath: event.target.value })} placeholder="/absolute/path/to/backups" />{(["compress", "flush", "shutdown"] as const).map((key) => <label key={key} className="flex gap-2"><input type="checkbox" checked={value[key]} onChange={(event) => onChange({ ...value, [key]: event.target.checked })} />{key}</label>)}<Button disabled={disabled} onClick={onSubmit}>Start quick backup</Button></div>;
}

function ConfirmBody({ action, pending, onConfirm }: { action: string; pending?: boolean; onConfirm: () => void }) {
  return <div className="grid gap-3 text-sm"><p className="text-muted-foreground">This cannot be undone.</p><Button variant="destructive" disabled={pending} onClick={onConfirm}>{pending ? "Working..." : action}</Button></div>;
}

function DeleteConfigBody({ pending, onConfirm }: { pending?: boolean; onConfirm: (purge: boolean) => void }) {
  const [purge, setPurge] = useState(false);
  return <div className="grid gap-3 text-sm"><p className="text-muted-foreground">Delete this backup config. Purging also removes owned archive files from disk.</p><label className="flex gap-2"><input type="checkbox" checked={purge} onChange={(event) => setPurge(event.target.checked)} />Purge archive files</label><Button variant="destructive" disabled={pending} onClick={() => onConfirm(purge)}>{pending ? "Deleting..." : "Delete config"}</Button></div>;
}
