import { Badge } from "@/components/ui/badge";
import { getStatusLabel, statusDotClass } from "@/lib/server-status";
import { cn } from "@/lib/utils";

type StatusPillProps = {
  status: string | null | undefined;
  label?: string;
  sub?: string;
};

export function StatusPill({ status, label, sub }: StatusPillProps) {
  return (
    <Badge variant="outline" className="h-8 max-w-[280px] gap-2 rounded-md bg-card px-2.5">
      <span className={cn("size-1.5 rounded-full", statusDotClass(status))} aria-hidden="true" />
      <span className="shrink-0 font-semibold">{label || getStatusLabel(status)}</span>
      {sub ? <span className="min-w-0 truncate text-muted-foreground">{sub}</span> : null}
    </Badge>
  );
}
