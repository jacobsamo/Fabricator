import { cn } from "@/lib/utils";

type StatCardProps = {
  label: string;
  value: string | number;
  unit?: string;
  accent?: boolean;
};

export function StatCard({ label, value, unit, accent = false }: StatCardProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="text-xs font-medium uppercase tracking-normal text-muted-foreground">{label}</div>
      <div className={cn("mt-2 flex items-baseline gap-1 text-2xl font-semibold", accent && "text-primary")}>
        <span>{value}</span>
        {unit ? <span className="text-sm font-medium text-muted-foreground">{unit}</span> : null}
      </div>
    </div>
  );
}
