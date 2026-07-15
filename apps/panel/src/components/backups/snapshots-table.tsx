import { Download, RotateCcw, Trash2 } from "lucide-react";

import { snapshotDownloadUrl } from "@/api/backups";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatFileSize, formatTimestamp } from "@/lib/format";

function text(value: unknown, fallback = "-") {
  return typeof value === "string" && value ? value : fallback;
}

function numberValue(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function typeLabel(type: unknown) {
  if (type === "safety") return "Safety";
  if (type === "restore") return "Restore";
  if (type === "import") return "Import";
  return "Backup";
}

function formatDuration(seconds: unknown) {
  const value = numberValue(seconds);
  if (value === null) return "-";
  if (value < 1) return "<1s";
  if (value < 60) return `${Math.round(value)}s`;
  const minutes = Math.floor(value / 60);
  const rest = Math.round(value % 60);
  return rest ? `${minutes}m ${rest}s` : `${minutes}m`;
}

export function SnapshotsTable({
  snapshots,
  configsById,
  serverId,
  busySnapshotId,
  loading,
  onRestore,
  onDelete,
}: {
  snapshots: Array<Record<string, unknown>>;
  configsById: Map<string, Record<string, unknown>>;
  serverId: string;
  busySnapshotId?: string | null;
  loading?: boolean;
  onRestore: (snapshot: Record<string, unknown>) => void;
  onDelete: (snapshot: Record<string, unknown>) => void;
}) {
  if (loading && snapshots.length === 0) return <Card className="p-5 text-center text-sm text-muted-foreground">Loading snapshots...</Card>;
  if (snapshots.length === 0) return <Card className="p-5 text-center text-sm text-muted-foreground">No snapshots yet.</Card>;
  return (
    <Card className="overflow-x-auto">
      <table className="w-full min-w-[760px] border-collapse text-sm">
        <thead className="border-b border-border text-left text-xs uppercase text-muted-foreground">
          <tr>
            <th className="p-3">Snapshot</th>
            <th className="p-3">Config</th>
            <th className="p-3">Type</th>
            <th className="p-3">Created</th>
            <th className="p-3">Size</th>
            <th className="p-3">Duration</th>
            <th className="p-3" />
          </tr>
        </thead>
        <tbody>
          {snapshots.map((snapshot) => {
            const id = text(snapshot.id);
            const configId = typeof snapshot.configId === "string" ? snapshot.configId : null;
            const configName = configId ? text(configsById.get(configId)?.name) : "Manual";
            const busy = busySnapshotId === id;
            return (
              <tr key={id} className="border-b border-border/70 last:border-0">
                <td className="max-w-[280px] p-3">
                  <div className="truncate font-mono text-xs text-foreground">{text(snapshot.fileName, id)}</div>
                  {snapshot.message ? <div className="truncate text-xs text-muted-foreground">{text(snapshot.message)}</div> : null}
                </td>
                <td className="p-3 text-xs text-muted-foreground">{configName}</td>
                <td className="p-3 text-xs text-muted-foreground">{typeLabel(snapshot.type)}</td>
                <td className="p-3 text-xs text-muted-foreground">{typeof snapshot.createdAt === "string" ? formatTimestamp(snapshot.createdAt) : "-"}</td>
                <td className="p-3 text-xs text-muted-foreground">{formatFileSize(numberValue(snapshot.sizeBytes) ?? 0)}</td>
                <td className="p-3 text-xs text-muted-foreground">{formatDuration(snapshot.durationSeconds)}</td>
                <td className="p-3">
                  <div className="flex justify-end gap-1">
                    <Button type="button" variant="ghost" size="sm" disabled={busy} onClick={() => onRestore(snapshot)}><RotateCcw className="size-3" />Restore</Button>
                    <a className="inline-flex h-8 items-center gap-1 rounded-md px-2 text-xs hover:bg-accent" href={snapshotDownloadUrl(serverId, id)} download><Download className="size-3" />tar</a>
                    <a className="inline-flex h-8 items-center rounded-md px-2 text-xs hover:bg-accent" href={snapshotDownloadUrl(serverId, id, "zip")} download>zip</a>
                    <Button type="button" variant="ghost" size="sm" disabled={busy} onClick={() => onDelete(snapshot)}><Trash2 className="size-3" />Delete</Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Card>
  );
}
