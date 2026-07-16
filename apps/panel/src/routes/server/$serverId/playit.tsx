import { useMemo, useState } from "react";
import { useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Check, Copy, ExternalLink, Play, RotateCcw, ShieldAlert, StopCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { serverQuery } from "@/queries/servers";
import { playitStatusQuery, usePlayitActionMutation } from "@/queries/playit";

export function PlayitPage() {
  const { serverId } = useParams({ from: "/app/server/$serverId" });
  const server = useQuery(serverQuery(serverId));
  const playit = useQuery(playitStatusQuery);
  const start = usePlayitActionMutation("start");
  const stop = usePlayitActionMutation("stop");
  const reset = usePlayitActionMutation("reset");
  const [confirm, setConfirm] = useState<"stop" | "reset" | null>(null);
  const [copied, setCopied] = useState(false);
  const actionError = start.error || stop.error || reset.error;
  const status = playit.data?.status || "stopped";
  const port = typeof server.data?.port === "number" ? server.data.port : null;
  const tunnels = Array.isArray(playit.data?.tunnels) ? playit.data.tunnels as Array<Record<string, unknown>> : [];
  const tunnel = useMemo(() => port === null ? null : tunnels.find((item) => item.local_port === port) || null, [port, tunnels]);
  const isRunning = status === "running";
  const isUnsupported = status === "unsupported";
  const isStopped = status === "stopped";
  const isClaiming = status === "claiming";
  const isError = status === "error";
  const showBinaryWarning = playit.data?.binary_verified === false && !(isError && /binary not found/i.test(String(playit.data?.error_reason || "")));

  async function copyAddress() {
    if (typeof tunnel?.address !== "string") return;
    await navigator.clipboard.writeText(tunnel.address);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="grid max-w-3xl gap-4">
      <Card>
        <CardHeader>
          <CardTitle>playit.gg tunnel agent</CardTitle>
          <CardDescription>These controls manage the shared playit.gg agent for all servers.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {isUnsupported ? <p className="text-sm text-muted-foreground">playit.gg is not available on this platform.</p> : null}
          {!isUnsupported && showBinaryWarning ? <div className="rounded-md border border-yellow-500/60 bg-yellow-500/10 p-3 text-sm text-yellow-300">playit binary signature unverified. See install logs.</div> : null}
          {actionError ? <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive" role="alert">{actionError.message}</div> : null}
          {!isUnsupported && isStopped ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div><p className="font-medium">Make your servers reachable without router setup.</p><p className="text-sm text-muted-foreground">playit.gg creates public tunnels with no port forwarding.</p></div>
              <Button disabled={start.isPending} onClick={() => start.mutate()}><Play className="size-4" />Enable playit.gg</Button>
            </div>
          ) : null}
          {!isUnsupported && isError ? (
            <div className="grid gap-3">
              <div className="flex gap-3 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm"><ShieldAlert className="size-5 text-destructive" /><div><p className="font-medium">playit.gg tunnel agent failed</p><p className="text-muted-foreground">{playit.data?.error_reason || "No further details. Check the playit.gg dashboard."}</p></div></div>
              <div className="flex gap-2"><Button variant="outline" onClick={() => start.mutate()}>Try again</Button><Button onClick={() => reset.mutate()}>Use different account</Button></div>
            </div>
          ) : null}
          {!isUnsupported && isClaiming && playit.data?.claim_url ? (
            <div className="grid gap-3 text-sm">
              <p>Open this link and approve the agent on playit.gg. The tunnel activates automatically.</p>
              <a className="inline-flex items-center gap-2 rounded-md border border-border bg-background p-3 text-primary" href={String(playit.data.claim_url)} target="_blank" rel="noreferrer">{String(playit.data.claim_url)}<ExternalLink className="size-4" /></a>
              <div className="flex gap-2"><Button variant="outline" onClick={() => stop.mutate()}>Cancel setup</Button><Button variant="outline" onClick={() => reset.mutate()}>Use different account</Button></div>
            </div>
          ) : null}
          {!isUnsupported && isRunning ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm"><span className="inline-flex items-center gap-2"><Check className="size-4 text-emerald-400" />Tunnel agent active.</span><div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => setConfirm("stop")}><StopCircle className="size-3" />Disable</Button><Button variant="outline" size="sm" onClick={() => setConfirm("reset")}><RotateCcw className="size-3" />Reset</Button></div></div>
          ) : null}
          {!isUnsupported && !isStopped && !isClaiming && !isRunning && !isError ? <div className="flex items-center justify-between rounded-md border border-border bg-background p-3 text-sm"><span>Connecting tunnel agent...</span><Button variant="outline" size="sm" onClick={() => stop.mutate()}>Cancel</Button></div> : null}
        </CardContent>
      </Card>
      {!isUnsupported && port !== null ? (
        <Card>
          <CardHeader>
            <CardTitle>This server&apos;s public address</CardTitle>
          </CardHeader>
          <CardContent>
            {!isRunning ? <p className="text-sm text-muted-foreground">{status === "claiming" ? "Finish the playit.gg sign-in above." : "Enable the tunnel agent above to expose this server."}</p> : null}
            {isRunning && !playit.data?.tunnels_known ? <p className="text-sm text-muted-foreground">Cannot confirm this server&apos;s tunnel right now. This updates automatically.</p> : null}
            {isRunning && playit.data?.tunnels_known && !tunnel ? <p className="text-sm text-muted-foreground">No tunnel forwards to port <code>{port}</code> yet. Create one in your playit.gg dashboard.</p> : null}
            {isRunning && tunnel?.disabled_reason ? <p className="text-sm text-destructive">This server&apos;s tunnel is disabled: {String(tunnel.disabled_reason)}</p> : null}
            {isRunning && typeof tunnel?.address === "string" ? <div className="flex items-center gap-2 rounded-md border border-border bg-background p-3"><span className="min-w-0 flex-1 truncate font-mono text-sm">{tunnel.address}</span><Button variant="ghost" size="icon" onClick={copyAddress}>{copied ? <Check className="size-4" /> : <Copy className="size-4" />}</Button></div> : null}
          </CardContent>
        </Card>
      ) : null}
      {confirm ? <div className="rounded-md border border-border bg-card p-4"><p className="text-sm">{confirm === "stop" ? "Disable the shared playit.gg agent for all servers?" : "Reset playit.gg and delete the saved account secret?"}</p><div className="mt-3 flex justify-end gap-2"><Button variant="ghost" onClick={() => setConfirm(null)}>Cancel</Button><Button variant={confirm === "reset" ? "destructive" : "default"} onClick={() => { (confirm === "stop" ? stop : reset).mutate(); setConfirm(null); }}>{confirm === "stop" ? "Disable" : "Reset"}</Button></div></div> : null}
    </div>
  );
}
