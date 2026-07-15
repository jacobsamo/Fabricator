import * as React from "react";

import { cn } from "@/lib/utils";

type PlayerAvatarProps = {
  name: string;
  uuid?: string | null;
  offlineMode?: boolean;
  size?: number;
  className?: string;
};

export function PlayerAvatar({ name, uuid, offlineMode = false, size = 28, className }: PlayerAvatarProps) {
  const [failed, setFailed] = React.useState(false);
  const identifier = uuid || name.trim() || null;
  const initial = name.trim().slice(0, 1).toUpperCase() || "?";

  React.useEffect(() => {
    setFailed(false);
  }, [identifier]);

  return (
    <span
      aria-hidden="true"
      className={cn("inline-flex shrink-0 items-center justify-center overflow-hidden rounded-sm border border-border bg-muted", className)}
      style={{ width: size, height: size }}
    >
      {identifier && !offlineMode && !failed ? (
        <img
          alt=""
          className="block size-full"
          height={size}
          src={`https://mc-heads.net/avatar/${encodeURIComponent(identifier)}/${size}`}
          width={size}
          onError={() => setFailed(true)}
        />
      ) : (
        <span className="text-xs font-bold text-muted-foreground">{initial}</span>
      )}
    </span>
  );
}
