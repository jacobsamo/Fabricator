import * as React from "react";
import { ShieldBan, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ServerPanel } from "@/components/server/server-panel";

export type IpBanEntry = {
  ip: string;
  reason?: string | null;
  created?: string | null;
};

type IpBansPanelProps = {
  ipBans: IpBanEntry[];
  onAdd: (ip: string, reason: string | null) => Promise<void>;
  onRemove: (ip: string) => Promise<void>;
};

function subtitle(entry: IpBanEntry) {
  const parts = [];
  if (entry.reason && entry.reason !== "Banned by an operator.") parts.push(entry.reason);
  if (entry.created) parts.push(`banned ${String(entry.created).split(" ")[0]}`);
  return parts.join(" · ");
}

export function IpBansPanel({ ipBans, onAdd, onRemove }: IpBansPanelProps) {
  const [expanded, setExpanded] = React.useState(false);
  const [ip, setIp] = React.useState("");
  const [reason, setReason] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = ip.trim();
    if (!value || busy) return;
    setBusy(true);
    try {
      await onAdd(value, reason.trim() || null);
      setIp("");
      setReason("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to ban IP");
    } finally {
      setBusy(false);
    }
  }

  async function remove(entry: IpBanEntry) {
    if (!window.confirm(`Unban ${entry.ip}?`)) return;
    try {
      await onRemove(entry.ip);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to unban IP");
    }
  }

  return (
    <ServerPanel
      title={`IP bans (${ipBans.length})`}
      action={
        <Button size="sm" variant="ghost" onClick={() => setExpanded((value) => !value)}>
          <ShieldBan />
          {expanded ? "Collapse" : "Manage"}
        </Button>
      }
    >
      {expanded ? (
        <div className="space-y-3">
          <form className="grid gap-2 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_auto]" onSubmit={submit}>
            <Input disabled={busy} placeholder="IP or wildcard (e.g. 192.168.*)" value={ip} onChange={(event) => setIp(event.target.value)} />
            <Input disabled={busy} placeholder="Reason (optional)" value={reason} onChange={(event) => setReason(event.target.value)} />
            <Button disabled={!ip.trim() || busy} size="sm" type="submit" variant="destructive">
              Ban IP
            </Button>
          </form>
          {ipBans.length ? (
            <ul className="divide-y divide-border">
              {ipBans.map((entry) => (
                <li className="flex items-center gap-3 py-2" key={entry.ip}>
                  <div className="min-w-0 flex-1">
                    <div className="font-mono text-sm font-medium">{entry.ip}</div>
                    {subtitle(entry) ? <div className="text-xs text-muted-foreground">{subtitle(entry)}</div> : null}
                  </div>
                  <Button aria-label={`Unban ${entry.ip}`} size="sm" variant="ghost" onClick={() => void remove(entry)}>
                    <Trash2 />
                    Unban
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="py-3 text-sm text-muted-foreground">No banned IPs.</div>
          )}
        </div>
      ) : null}
    </ServerPanel>
  );
}
