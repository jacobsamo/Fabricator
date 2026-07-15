import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Check, ChevronDown, Plus } from "lucide-react";

import type { ServerSummary } from "@/api/schemas";
import { Button } from "@/components/ui/button";
import { getEffectiveStatus, getServerMeta, statusDotClass } from "@/lib/server-status";
import { cn } from "@/lib/utils";
import { serversQuery } from "@/queries/servers";

type ServerSwitcherProps = {
  serverId: string;
  currentServer: ServerSummary | null | undefined;
};

export function ServerSwitcher({ serverId, currentServer }: ServerSwitcherProps) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const servers = useQuery(serversQuery);
  const current =
    servers.data?.find((server) => server.id === serverId) ||
    currentServer || {
      id: serverId,
      name: serverId,
      status: "unknown",
    };

  return (
    <div className="relative">
      <Button
        type="button"
        variant="outline"
        className="h-auto w-full justify-start px-3 py-2 text-left"
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((value) => !value)}
      >
        <span className={cn("size-2 rounded-full", statusDotClass(getEffectiveStatus(current, "unknown")))} aria-hidden="true" />
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-sm font-semibold">{current.name}</span>
          <span className="truncate text-xs font-normal text-muted-foreground">{getServerMeta(current)}</span>
        </span>
        <ChevronDown className="text-muted-foreground" />
      </Button>

      {open ? (
        <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-40 overflow-hidden rounded-md border border-border bg-popover shadow-lg" role="listbox">
          {(servers.data || [current]).map((server) => {
            const selected = server.id === serverId;
            return (
              <button
                type="button"
                key={server.id}
                role="option"
                aria-selected={selected}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-muted-foreground transition hover:bg-accent hover:text-accent-foreground"
                onClick={() => {
                  setOpen(false);
                  if (!selected) {
                    void navigate({ to: "/server/$serverId/overview", params: { serverId: server.id } });
                  }
                }}
              >
                <span className={cn("size-1.5 rounded-full", statusDotClass(getEffectiveStatus(server, "unknown")))} aria-hidden="true" />
                <span className="min-w-0 flex-1 truncate">{server.name}</span>
                {selected ? <Check className="size-3.5 text-primary" /> : null}
              </button>
            );
          })}
          <div className="border-t border-border" />
          <button
            type="button"
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-muted-foreground transition hover:bg-accent hover:text-accent-foreground"
            onClick={() => setOpen(false)}
          >
            <Plus className="size-3.5" />
            Add server
          </button>
        </div>
      ) : null}
    </div>
  );
}
