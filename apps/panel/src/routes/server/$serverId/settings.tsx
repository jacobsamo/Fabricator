import { useState } from "react";
import { useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChangePasswordPanel } from "@/components/settings/change-password-panel";
import { JavaManagerPanel } from "@/components/settings/java-manager-panel";
import { authStatusQuery } from "@/queries/auth";
import { serverQuery, useSetServerAutoStartMutation } from "@/queries/servers";
import { getUpdateStatus } from "@/api/servers";

export function SettingsPage() {
  const { serverId } = useParams({ from: "/app/server/$serverId" });
  const server = useQuery(serverQuery(serverId));
  const auth = useQuery(authStatusQuery);
  const update = useQuery({ queryKey: ["session", "system", "update", "status"], queryFn: getUpdateStatus });
  const autostart = useSetServerAutoStartMutation(serverId);
  const [optimisticMode, setOptimisticMode] = useState<string | null>(null);
  const mode = optimisticMode || (typeof server.data?.autoStart === "string" ? server.data.autoStart : "never");

  async function setMode(next: "always" | "last" | "never") {
    const previous = mode;
    setOptimisticMode(next);
    try {
      await autostart.mutateAsync(next);
    } catch {
      setOptimisticMode(previous);
    }
  }

  return (
    <div className="grid max-w-3xl gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Auto-start</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2">
          {[
            ["always", "Always start", "Start this server every time Fabricator starts."],
            ["last", "Restore last state", "Start only if it was running when Fabricator last stopped."],
            ["never", "Never", "Start it manually when you need it."],
          ].map(([value, label, hint]) => (
            <label key={value} className={`flex gap-3 rounded-md border p-3 ${mode === value ? "border-primary bg-primary/10" : "border-border bg-background"}`}>
              <input type="radio" name="autostart-mode" checked={mode === value} onChange={() => void setMode(value as "always" | "last" | "never")} />
              <span><span className="block text-sm font-medium">{label}</span><span className="text-xs text-muted-foreground">{hint}</span></span>
            </label>
          ))}
          {autostart.error ? <p className="text-sm text-destructive">{autostart.error.message}</p> : null}
        </CardContent>
      </Card>
      <JavaManagerPanel />
      {auth.data?.enabled ? <ChangePasswordPanel /> : null}
      <Card>
        <CardHeader>
          <CardTitle>About</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm">
          <div className="flex justify-between gap-3"><span className="text-muted-foreground">Version</span><span className="font-mono">{update.data?.currentVersion || "unknown"}</span></div>
          <div className="flex justify-between gap-3"><span className="text-muted-foreground">Application</span><span>Fabricator</span></div>
          <Button variant="outline" size="sm" className="mt-2 justify-self-start" onClick={() => void update.refetch()}>Refresh version</Button>
        </CardContent>
      </Card>
    </div>
  );
}
