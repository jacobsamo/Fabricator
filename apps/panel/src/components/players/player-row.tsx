import * as React from "react";

import { PlayerAvatar } from "@/components/players/player-avatar";
import { cn } from "@/lib/utils";

type PlayerRowProps = {
  name: string;
  uuid?: string | null;
  offlineMode?: boolean;
  subtitle?: string;
  online?: boolean;
  children?: React.ReactNode;
};

export function PlayerRow({ name, uuid, offlineMode, subtitle, online = false, children }: PlayerRowProps) {
  return (
    <li className="flex items-center gap-2 border-b border-border py-2 last:border-b-0">
      <span className={cn("size-[7px] shrink-0 rounded-full", online ? "bg-success" : "bg-muted-foreground")} />
      <PlayerAvatar name={name} uuid={uuid} offlineMode={offlineMode} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-foreground">{name}</div>
        {subtitle ? <div className="font-mono text-xs text-muted-foreground">{subtitle}</div> : null}
      </div>
      {children ? <div className="flex shrink-0 items-center gap-2">{children}</div> : null}
    </li>
  );
}
