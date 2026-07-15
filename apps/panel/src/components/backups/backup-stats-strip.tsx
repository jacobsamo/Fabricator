import { Card, CardContent } from "@/components/ui/card";
import { formatFileSize, formatTimestamp } from "@/lib/format";

export function BackupStatsStrip({ summary, loading }: { summary?: Record<string, unknown>; loading?: boolean }) {
  const lastSnapshot = summary?.last_snapshot && typeof summary.last_snapshot === "object" ? summary.last_snapshot as Record<string, unknown> : null;
  const nextRun = summary?.next_run && typeof summary.next_run === "object" ? summary.next_run as Record<string, unknown> : null;
  const stats = [
    ["Snapshots", loading ? "..." : String(summary?.total_snapshots ?? 0)],
    ["Total size", typeof summary?.total_size_bytes === "number" ? formatFileSize(summary.total_size_bytes) : "-"],
    ["Last snapshot", typeof lastSnapshot?.createdAt === "string" ? formatTimestamp(lastSnapshot.createdAt) : "-"],
    ["Next scheduled", typeof nextRun?.next_run_time === "string" ? formatTimestamp(nextRun.next_run_time) : "-"],
  ];
  return (
    <div className="grid gap-3 md:grid-cols-4">
      {stats.map(([label, value]) => (
        <Card key={label}>
          <CardContent className="p-4">
            <p className="text-xs font-semibold uppercase text-muted-foreground">{label}</p>
            <p className="mt-1 truncate text-base font-semibold">{value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
