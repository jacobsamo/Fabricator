import type { ParsedLogLine } from "@/components/server/log-utils";
import { cn } from "@/lib/utils";

type LogViewerProps = {
  lines: ParsedLogLine[];
  empty: string;
  className?: string;
};

const levelClass = {
  INFO: "text-info",
  WARN: "text-warning",
  ERROR: "text-destructive",
  DEBUG: "text-primary",
} as const;

export function LogViewer({ lines, empty, className }: LogViewerProps) {
  return (
    <div className={cn("rounded-md border border-border bg-secondary p-3 font-mono text-xs text-muted-foreground", className)}>
      {lines.length === 0 ? (
        <div className="py-6 text-center font-sans text-sm text-muted-foreground">{empty}</div>
      ) : (
        lines.map((line) => (
          <div key={line.id} className="flex items-baseline gap-2 py-px">
            {line.time ? <span className="min-w-14 shrink-0 text-muted-foreground/70">{line.time}</span> : null}
            <span className={cn("min-w-10 shrink-0 font-medium", levelClass[line.level])}>{line.level}</span>
            <span className="min-w-0 break-words text-secondary-foreground">{line.message}</span>
          </div>
        ))
      )}
    </div>
  );
}
