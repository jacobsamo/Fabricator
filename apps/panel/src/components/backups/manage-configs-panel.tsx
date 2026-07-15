import { Plus, Trash2 } from "lucide-react";

import { BackupConfigForm } from "@/forms/backup-config-form";
import type { BackupConfigPayload } from "@/api/backups";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatFileSize } from "@/lib/format";

function configId(config: Record<string, unknown>) {
  return typeof config.id === "string" ? config.id : "";
}

export function ManageConfigsPanel({
  configs,
  snapshots,
  selectedConfigId,
  defaultStoragePath,
  saving,
  runningConfigId,
  activeJob,
  onSelect,
  onCreate,
  onSave,
  onRun,
  onDelete,
}: {
  configs: Array<Record<string, unknown>>;
  snapshots: Array<Record<string, unknown>>;
  selectedConfigId: string | null;
  defaultStoragePath?: string;
  saving?: boolean;
  runningConfigId?: string | null;
  activeJob?: Record<string, unknown> | null;
  onSelect: (id: string | null) => void;
  onCreate: () => void;
  onSave: (configId: string | null, payload: BackupConfigPayload) => Promise<void> | void;
  onRun: (configId: string) => void;
  onDelete: (config: Record<string, unknown>) => void;
}) {
  const selected = selectedConfigId ? configs.find((config) => configId(config) === selectedConfigId) ?? null : null;
  const stats = new Map<string, { count: number; bytes: number }>();
  for (const snapshot of snapshots) {
    if (typeof snapshot.configId !== "string") continue;
    const current = stats.get(snapshot.configId) || { count: 0, bytes: 0 };
    current.count += 1;
    current.bytes += typeof snapshot.sizeBytes === "number" ? snapshot.sizeBytes : 0;
    stats.set(snapshot.configId, current);
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>Backup schedules</CardTitle>
        <Button type="button" variant="outline" size="sm" onClick={onCreate}><Plus className="size-3" />New</Button>
      </CardHeader>
      <CardContent className="grid gap-5 lg:grid-cols-[260px_1fr]">
        <aside className="grid content-start gap-2">
          <button type="button" className={`rounded-md border px-3 py-2 text-left text-sm ${selectedConfigId === null ? "border-primary bg-primary/10" : "border-border bg-background"}`} onClick={() => onSelect(null)}>New config</button>
          {configs.map((config) => {
            const id = configId(config);
            const itemStats = stats.get(id) || { count: 0, bytes: 0 };
            return (
              <button key={id} type="button" className={`rounded-md border px-3 py-2 text-left ${selectedConfigId === id ? "border-primary bg-primary/10" : "border-border bg-background"}`} onClick={() => onSelect(id)}>
                <div className="truncate text-sm font-medium">{typeof config.name === "string" ? config.name : "(unnamed)"}</div>
                <div className="mt-1 text-xs text-muted-foreground">{itemStats.count} snapshots · {formatFileSize(itemStats.bytes)}</div>
              </button>
            );
          })}
        </aside>
        <div className="grid gap-3">
          {selected ? (
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" size="sm" disabled={Boolean(activeJob?.active) || Boolean(runningConfigId)} onClick={() => onRun(configId(selected))}>Run now</Button>
              <Button type="button" variant="ghost" size="sm" disabled={saving} onClick={() => onDelete(selected)}><Trash2 className="size-3" />Delete</Button>
            </div>
          ) : null}
          <BackupConfigForm
            key={selectedConfigId || "new"}
            config={selected}
            defaultStoragePath={defaultStoragePath}
            disabled={saving}
            submitLabel={selected ? "Save changes" : "Create config"}
            onCancel={() => onSelect(selectedConfigId)}
            onSubmit={(payload) => onSave(selectedConfigId, payload)}
          />
        </div>
      </CardContent>
    </Card>
  );
}
