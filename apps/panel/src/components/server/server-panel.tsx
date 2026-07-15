import type * as React from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type ServerPanelProps = React.HTMLAttributes<HTMLDivElement> & {
  title?: string;
  action?: React.ReactNode;
  padded?: boolean;
};

export function ServerPanel({ title, action, padded = true, className, children, ...props }: ServerPanelProps) {
  return (
    <Card className={cn("overflow-hidden", className)} {...props}>
      {(title || action) && (
        <CardHeader className="flex-row items-center justify-between gap-3 p-4">
          {title ? <CardTitle className="text-sm uppercase tracking-normal text-muted-foreground">{title}</CardTitle> : <span />}
          {action}
        </CardHeader>
      )}
      <CardContent className={cn(padded ? "p-4 pt-0" : "p-0", !title && padded && "pt-4")}>{children}</CardContent>
    </Card>
  );
}
