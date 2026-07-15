import { useEffect, useMemo, useState } from "react";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { areServerPropertiesDirty, defaultServerProperties, type ServerProperties } from "@/lib/server-settings";
import { useUpdateServerSettingsMutation } from "@/queries/servers";
import type { ServerDetail } from "@/api/schemas";

const serverPropertiesFormSchema = z.object({
  name: z.string().min(1),
  port: z.coerce.number().int().min(1024).max(65535),
  maxPlayers: z.coerce.number().int().min(1).max(1000),
  memory: z.coerce.number().min(1).max(64),
  motd: z.string().max(59),
}).passthrough();

const sections: Array<{ title: string; advanced?: boolean; fields: Array<keyof ServerProperties> }> = [
  { title: "Server identity", fields: ["name", "bugReportLink", "motd", "port", "serverIp", "maxPlayers"] },
  { title: "Gameplay", fields: ["difficulty", "gamemode", "spawnProtection", "playerIdleTimeout", "pvp", "whitelist", "commandBlocks"] },
  { title: "Gameplay expert", advanced: true, fields: ["forceGamemode", "hardcore", "allowFlight", "enforceWhitelist", "functionPermissionLevel", "opPermissionLevel", "pauseWhenEmptySeconds"] },
  { title: "World configuration", fields: ["levelName", "levelType", "seed", "generateStructures", "spawnAnimals", "spawnMonsters", "spawnNpcs"] },
  { title: "World expert", advanced: true, fields: ["generatorSettings", "maxWorldSize", "entityBroadcastRangePercentage", "maxChainedNeighborUpdates"] },
  { title: "Resources and packs", advanced: true, fields: ["resourcePack", "resourcePackSha1", "resourcePackId", "resourcePackPrompt", "requireResourcePack", "initialEnabledPacks", "initialDisabledPacks"] },
  { title: "Networking", advanced: true, fields: ["enableStatus", "statusHeartbeatInterval", "rateLimit", "networkCompressionThreshold", "enableQuery", "queryPort", "enableRcon", "rconPort", "rconPassword"] },
  { title: "Security and automation", advanced: true, fields: ["onlineMode", "enforceSecureProfile", "hideOnlinePlayers", "preventProxyConnections", "logIps", "acceptsTransfers", "useNativeTransport", "syncChunkWrites", "broadcastConsoleToOps", "broadcastRconToOps", "enableCodeOfConduct", "enableJmxMonitoring", "textFilteringConfig", "textFilteringVersion"] },
  { title: "Performance", fields: ["memory", "viewDistance", "simulationDistance"] },
  { title: "Performance expert", advanced: true, fields: ["maxTickTime", "regionFileCompression"] },
];

const labels: Partial<Record<keyof ServerProperties, string>> = {
  serverIp: "Bind address",
  motd: "Message of the day",
  maxPlayers: "Max players",
  forceGamemode: "Force gamemode",
  allowFlight: "Allow flight",
  commandBlocks: "Enable command blocks",
  enforceWhitelist: "Enforce whitelist",
  functionPermissionLevel: "Function permission level",
  opPermissionLevel: "Operator permission level",
  playerIdleTimeout: "Idle timeout",
  pauseWhenEmptySeconds: "Pause when empty",
  levelName: "World folder name",
  levelType: "World type",
  generateStructures: "Generate structures",
  spawnNpcs: "Spawn NPCs",
  entityBroadcastRangePercentage: "Entity broadcast range",
  maxChainedNeighborUpdates: "Max chained neighbor updates",
  resourcePack: "Resource pack URL",
  resourcePackSha1: "Resource pack SHA-1",
  resourcePackId: "Resource pack ID",
  resourcePackPrompt: "Resource pack prompt",
  requireResourcePack: "Require resource pack",
  initialEnabledPacks: "Enabled data packs",
  initialDisabledPacks: "Disabled data packs",
  enableStatus: "Enable status",
  statusHeartbeatInterval: "Status heartbeat interval",
  networkCompressionThreshold: "Compression threshold",
  enableQuery: "Enable query",
  queryPort: "Query port",
  enableRcon: "Enable RCON",
  rconPort: "RCON port",
  rconPassword: "RCON password",
  onlineMode: "Online mode",
  enforceSecureProfile: "Enforce secure profiles",
  hideOnlinePlayers: "Hide player count",
  preventProxyConnections: "Prevent proxy connections",
  logIps: "Log player IPs",
  acceptsTransfers: "Accept transfers",
  useNativeTransport: "Use native transport",
  syncChunkWrites: "Sync chunk writes",
  broadcastConsoleToOps: "Broadcast console to ops",
  broadcastRconToOps: "Broadcast RCON to ops",
  enableCodeOfConduct: "Enable code of conduct",
  enableJmxMonitoring: "Enable JMX monitoring",
  textFilteringConfig: "Text filtering config",
  textFilteringVersion: "Text filtering version",
  viewDistance: "View distance",
  simulationDistance: "Simulation distance",
  maxTickTime: "Max tick time",
  regionFileCompression: "Region file compression",
};

const booleanFields = new Set<keyof ServerProperties>([
  "forceGamemode", "hardcore", "allowFlight", "pvp", "commandBlocks", "whitelist", "enforceWhitelist",
  "onlineMode", "enforceSecureProfile", "hideOnlinePlayers", "preventProxyConnections", "logIps", "acceptsTransfers",
  "enableStatus", "enableQuery", "enableRcon", "requireResourcePack", "generateStructures", "spawnAnimals",
  "spawnMonsters", "spawnNpcs", "syncChunkWrites", "useNativeTransport", "broadcastConsoleToOps", "broadcastRconToOps",
  "enableCodeOfConduct", "enableJmxMonitoring",
]);

const numberFields = new Set<keyof ServerProperties>([
  "port", "maxPlayers", "spawnProtection", "functionPermissionLevel", "opPermissionLevel", "playerIdleTimeout",
  "pauseWhenEmptySeconds", "statusHeartbeatInterval", "queryPort", "rconPort", "rateLimit", "networkCompressionThreshold",
  "textFilteringVersion", "viewDistance", "simulationDistance", "memory", "maxWorldSize", "entityBroadcastRangePercentage",
  "maxChainedNeighborUpdates", "maxTickTime",
]);

export function ServerPropertiesForm({ server, canEdit }: { server: ServerDetail; canEdit: boolean }) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [error, setError] = useState("");
  const baseline = useMemo(() => defaultServerProperties(server), [server]);
  const mutation = useUpdateServerSettingsMutation(server.id);
  const form = useForm({
    defaultValues: baseline,
    onSubmit: async ({ value }) => {
      setError("");
      const parsed = serverPropertiesFormSchema.safeParse(value);
      if (!parsed.success) {
        setError(parsed.error.issues[0]?.message || "Invalid server properties.");
        return;
      }
      await mutation.mutateAsync(value);
    },
  });
  useEffect(() => {
    form.reset(baseline);
  }, [baseline, form]);

  return (
    <form className="grid max-w-5xl gap-4 pb-20" onSubmit={(event) => { event.preventDefault(); void form.handleSubmit(); }}>
      {!canEdit ? <div className="rounded-md border border-yellow-500/60 bg-yellow-500/10 p-3 text-sm text-yellow-300">Stop the server before editing configuration.</div> : null}
      <section className="rounded-lg border border-border bg-card p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold">{showAdvanced ? "Expert mode" : "Basic mode"}</h2>
            <p className="text-sm text-muted-foreground">{showAdvanced ? "All configuration options are visible. Handle with care." : "Hides risky server.properties for quick edits."}</p>
          </div>
          <Button type="button" variant="outline" onClick={() => setShowAdvanced((value) => !value)}>
            {showAdvanced ? "Switch to Basic" : "Enable Expert Mode"}
          </Button>
        </div>
      </section>
      {sections.filter((section) => showAdvanced || !section.advanced).map((section) => (
        <section key={section.title} className="rounded-lg border border-border bg-card p-5">
          <h2 className="mb-4 text-base font-semibold">{section.title}</h2>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {section.fields.map((name) => <PropertyField key={name} form={form} name={name} disabled={!canEdit || mutation.isPending} />)}
          </div>
        </section>
      ))}
      {error ? <p className="text-sm text-destructive" role="alert">{error}</p> : null}
      {mutation.error ? <p className="text-sm text-destructive" role="alert">{mutation.error.message}</p> : null}
      <form.Subscribe selector={(state) => areServerPropertiesDirty(state.values, baseline)}>
        {(dirty) => (
          <footer className="fixed inset-x-6 bottom-6 z-10 flex justify-end gap-2 rounded-lg border border-border bg-card/95 p-3 backdrop-blur">
            <Button type="button" variant="ghost" disabled={!dirty || !canEdit || mutation.isPending} onClick={() => form.reset(baseline)}>Reset</Button>
            <Button type="submit" disabled={!dirty || !canEdit || mutation.isPending}>{mutation.isPending ? "Saving..." : "Save Changes"}</Button>
          </footer>
        )}
      </form.Subscribe>
    </form>
  );
}

function PropertyField({ form, name, disabled }: { form: { Field: React.ComponentType<any> }; name: keyof ServerProperties; disabled: boolean }) {
  const label = labels[name] || String(name).replace(/([A-Z])/g, " $1").replace(/^./, (char) => char.toUpperCase());
  if (booleanFields.has(name)) {
    return (
      <form.Field name={name}>
        {(field: { state: { value: unknown }; handleChange: (value: boolean) => void }) => (
          <label className="flex min-h-10 items-center gap-2 rounded-md border border-border bg-background px-3 text-sm text-secondary-foreground">
            <input type="checkbox" checked={Boolean(field.state.value)} disabled={disabled} onChange={(event) => field.handleChange(event.target.checked)} />
            {label}
          </label>
        )}
      </form.Field>
    );
  }
  return (
    <form.Field name={name}>
      {(field: { state: { value: unknown }; handleChange: (value: string | number) => void }) => (
        <label className="grid gap-1 text-xs font-semibold uppercase text-muted-foreground">
          {label}
          <Input
            type={numberFields.has(name) ? "number" : name.toLowerCase().includes("password") ? "password" : "text"}
            value={String(field.state.value ?? "")}
            disabled={disabled}
            maxLength={name === "motd" ? 59 : undefined}
            onChange={(event) => field.handleChange(numberFields.has(name) ? Number(event.target.value) : event.target.value)}
          />
        </label>
      )}
    </form.Field>
  );
}
