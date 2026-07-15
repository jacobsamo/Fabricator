import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import { Ban, Crown, ShieldCheck, UserPlus, X } from "lucide-react";
import { toast } from "sonner";

import { del, get, patch, post } from "@/api/client";
import { IpBansPanel, type IpBanEntry } from "@/components/players/ip-bans-panel";
import { PlayerRow } from "@/components/players/player-row";
import { ServerPanel } from "@/components/server/server-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { serverQuery } from "@/queries/servers";
import { cn } from "@/lib/utils";

type PlayerEntry = {
  name: string;
  uuid?: string | null;
  expiresOn?: string | null;
  level?: number;
  reason?: string | null;
};

type PlayersState = {
  whitelist: PlayerEntry[];
  ops: PlayerEntry[];
  bans: PlayerEntry[];
  ipBans: IpBanEntry[];
  knownPlayers: PlayerEntry[];
  whitelistActive: boolean;
  enforceWhitelist: boolean;
  onlineMode: boolean;
};

type PlayerRowModel = {
  name: string;
  uuid?: string | null;
  lastSeen: Date | null;
  isOnline: boolean;
  isOp: boolean;
  opLevel: number;
  isBanned: boolean;
  isWhitelisted: boolean;
};

const emptyPlayersState: PlayersState = {
  whitelist: [],
  ops: [],
  bans: [],
  ipBans: [],
  knownPlayers: [],
  whitelistActive: false,
  enforceWhitelist: false,
  onlineMode: true,
};

const playersStateKey = (serverId: string) => ["session", "server", serverId, "players", "state"] as const;
const onlinePlayersKey = (serverId: string) => ["session", "server", serverId, "players", "online"] as const;

function getPlayersState(serverId: string) {
  return get<PlayersState>(`/api/servers/${serverId}/players/state`);
}

function getOnlinePlayers(serverId: string) {
  return get<PlayerEntry[]>(`/api/servers/${serverId}/players/online`);
}

function addToWhitelist(serverId: string, name: string) {
  return post<PlayerEntry>(`/api/servers/${serverId}/players/whitelist`, { name });
}

function removeFromWhitelist(serverId: string, name: string) {
  return del(`/api/servers/${serverId}/players/whitelist`, { name });
}

function addOp(serverId: string, name: string, level: number) {
  return post<PlayerEntry>(`/api/servers/${serverId}/players/ops`, { name, level });
}

function setOpLevel(serverId: string, name: string, level: number) {
  return patch(`/api/servers/${serverId}/players/ops`, { name, level });
}

function removeOp(serverId: string, name: string) {
  return del(`/api/servers/${serverId}/players/ops`, { name });
}

function banPlayer(serverId: string, name: string, reason: string | null) {
  return post<PlayerEntry>(`/api/servers/${serverId}/players/bans`, { name, reason });
}

function unbanPlayer(serverId: string, name: string) {
  return del(`/api/servers/${serverId}/players/bans`, { name });
}

function kickPlayer(serverId: string, name: string, reason: string | null) {
  return post(`/api/servers/${serverId}/players/kick`, { name, ...(reason ? { reason } : {}) });
}

function banIp(serverId: string, ip: string, reason: string | null) {
  return post<IpBanEntry>(`/api/servers/${serverId}/players/bans/ip`, { ip, ...(reason ? { reason } : {}) });
}

function unbanIp(serverId: string, ip: string) {
  return del(`/api/servers/${serverId}/players/bans/ip`, { ip });
}

function setWhitelistActive(serverId: string, active: boolean) {
  return patch(`/api/servers/${serverId}/players/whitelist/active`, { active });
}

function setEnforceWhitelist(serverId: string, active: boolean) {
  return patch(`/api/servers/${serverId}/players/whitelist/enforce`, { active });
}

function normalizeName(name: string) {
  return name.trim().toLowerCase();
}

function lastSeenFromExpiresOn(expiresOn?: string | null) {
  if (!expiresOn) return null;
  const date = new Date(expiresOn);
  if (Number.isNaN(date.getTime())) return null;
  return new Date(date.getTime() - 30 * 24 * 60 * 60 * 1000);
}

function relativeTime(date: Date | null) {
  if (!date) return "";
  const minutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60000));
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function mergePlayers(state: PlayersState, online: PlayerEntry[]): PlayerRowModel[] {
  const byName = new Map<string, { name: string; uuid?: string | null; lastSeen: Date | null }>();
  const ensure = (entry: PlayerEntry) => {
    const key = normalizeName(entry.name || "");
    if (!key) return null;
    const current = byName.get(key);
    if (current) {
      if (entry.uuid && !current.uuid) current.uuid = entry.uuid;
      return current;
    }
    const created = { name: entry.name, uuid: entry.uuid ?? null, lastSeen: null };
    byName.set(key, created);
    return created;
  };

  for (const player of state.knownPlayers) {
    const row = ensure(player);
    if (row) row.lastSeen = lastSeenFromExpiresOn(player.expiresOn);
  }
  for (const entry of [...state.whitelist, ...state.ops, ...state.bans, ...online]) ensure(entry);

  const onlineMap = new Map(online.map((player) => [normalizeName(player.name), player]));
  const opMap = new Map(state.ops.map((player) => [normalizeName(player.name), player]));
  const banMap = new Map(state.bans.map((player) => [normalizeName(player.name), player]));
  const whitelistSet = new Set(state.whitelist.map((player) => normalizeName(player.name)));

  return Array.from(byName.values())
    .map((row) => {
      const key = normalizeName(row.name);
      const op = opMap.get(key);
      return {
        name: row.name,
        uuid: row.uuid,
        lastSeen: row.lastSeen,
        isOnline: onlineMap.has(key),
        isOp: Boolean(op),
        opLevel: op?.level ?? 4,
        isBanned: banMap.has(key),
        isWhitelisted: whitelistSet.has(key),
      };
    })
    .sort((a, b) => {
      if (a.isOnline !== b.isOnline) return a.isOnline ? -1 : 1;
      return (b.lastSeen?.getTime() ?? 0) - (a.lastSeen?.getTime() ?? 0);
    });
}

type ListName = "whitelist" | "ops" | "bans" | "ipBans";

function withAddedEntry(state: PlayersState | undefined, list: ListName, entry: PlayerEntry | IpBanEntry) {
  const next = state ?? emptyPlayersState;
  return { ...next, [list]: [...next[list], entry] };
}

function withoutNamedEntry(state: PlayersState | undefined, list: "whitelist" | "ops" | "bans", name: string) {
  const next = state ?? emptyPlayersState;
  return { ...next, [list]: next[list].filter((entry) => normalizeName(entry.name) !== normalizeName(name)) };
}

function withoutIpEntry(state: PlayersState | undefined, ip: string) {
  const next = state ?? emptyPlayersState;
  return { ...next, ipBans: next.ipBans.filter((entry) => entry.ip.toLowerCase() !== ip.toLowerCase()) };
}

function useOptimisticPlayersMutation<TVariables>({
  serverId,
  mutate,
  update,
  success,
}: {
  serverId: string;
  mutate: (variables: TVariables) => Promise<unknown>;
  update: (state: PlayersState | undefined, variables: TVariables) => PlayersState;
  success?: (variables: TVariables) => string;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: mutate,
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: playersStateKey(serverId) });
      const previous = queryClient.getQueryData<PlayersState>(playersStateKey(serverId));
      queryClient.setQueryData(playersStateKey(serverId), (current: PlayersState | undefined) => update(current, variables));
      return { previous };
    },
    onError: (error, _variables, context) => {
      queryClient.setQueryData(playersStateKey(serverId), context?.previous);
      toast.error(error instanceof Error ? error.message : "Operation failed");
    },
    onSuccess: (_data, variables) => {
      if (success) toast.success(success(variables));
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: playersStateKey(serverId) });
    },
  });
}

export function PlayersPage() {
  const { serverId } = useParams({ from: "/app/server/$serverId" });
  const queryClient = useQueryClient();
  const server = useQuery(serverQuery(serverId));
  const stateQuery = useQuery({
    queryKey: playersStateKey(serverId),
    queryFn: () => getPlayersState(serverId),
  });
  const isRunning = server.data?.status === "running";
  const onlineQuery = useQuery({
    queryKey: onlinePlayersKey(serverId),
    queryFn: () => getOnlinePlayers(serverId),
    enabled: isRunning,
    refetchInterval: isRunning ? 5000 : false,
  });

  const state = stateQuery.data ?? emptyPlayersState;
  const online = isRunning ? (onlineQuery.data ?? []) : [];
  const players = React.useMemo(() => mergePlayers(state, online), [state, online]);
  const [filter, setFilter] = React.useState("all");
  const [search, setSearch] = React.useState("");
  const [addName, setAddName] = React.useState("");
  const [reasonTarget, setReasonTarget] = React.useState<{ name: string; mode: "kick" | "ban" } | null>(null);
  const [reasonText, setReasonText] = React.useState("");
  const reasonInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (!isRunning) queryClient.setQueryData(onlinePlayersKey(serverId), []);
  }, [isRunning, queryClient, serverId]);

  React.useEffect(() => {
    reasonInputRef.current?.focus();
  }, [reasonTarget]);

  const filters = [
    { id: "all", label: "All", count: players.length },
    { id: "online", label: "Online", count: online.length },
    { id: "whitelisted", label: "Whitelisted", count: state.whitelist.length },
    { id: "ops", label: "Operators", count: state.ops.length },
    { id: "banned", label: "Banned", count: state.bans.length },
  ];

  const filteredPlayers = players.filter((player) => {
    const matchesFilter =
      filter === "all" ||
      (filter === "online" && player.isOnline) ||
      (filter === "whitelisted" && player.isWhitelisted) ||
      (filter === "ops" && player.isOp) ||
      (filter === "banned" && player.isBanned);
    const query = search.trim().toLowerCase();
    return matchesFilter && (!query || player.name.toLowerCase().includes(query));
  });

  function emptyMessage() {
    if (search.trim()) return `No players match "${search.trim()}".`;
    if (filter === "online") return isRunning ? "No players online." : "Server is stopped - no players online.";
    if (filter === "whitelisted") return "No players whitelisted yet.";
    if (filter === "ops") return "No operators yet.";
    if (filter === "banned") return "No banned players.";
    return "No players yet.";
  }

  const addWhitelistMutation = useOptimisticPlayersMutation<string>({
    serverId,
    mutate: (name) => addToWhitelist(serverId, name),
    update: (current, name) => withAddedEntry(current, "whitelist", { name, uuid: null }),
  });
  const removeWhitelistMutation = useOptimisticPlayersMutation<string>({
    serverId,
    mutate: (name) => removeFromWhitelist(serverId, name),
    update: (current, name) => withoutNamedEntry(current, "whitelist", name),
    success: (name) => `Removed ${name} from the whitelist`,
  });
  const addOpMutation = useOptimisticPlayersMutation<{ name: string; level: number }>({
    serverId,
    mutate: ({ name, level }) => addOp(serverId, name, level),
    update: (current, { name, level }) => withAddedEntry(current, "ops", { name, level, uuid: null }),
  });
  const removeOpMutation = useOptimisticPlayersMutation<string>({
    serverId,
    mutate: (name) => removeOp(serverId, name),
    update: (current, name) => withoutNamedEntry(current, "ops", name),
    success: (name) => `Removed operator ${name}`,
  });
  const addBanMutation = useOptimisticPlayersMutation<{ name: string; reason: string | null }>({
    serverId,
    mutate: ({ name, reason }) => banPlayer(serverId, name, reason),
    update: (current, { name, reason }) => withAddedEntry(current, "bans", { name, reason, uuid: null }),
  });
  const removeBanMutation = useOptimisticPlayersMutation<string>({
    serverId,
    mutate: (name) => unbanPlayer(serverId, name),
    update: (current, name) => withoutNamedEntry(current, "bans", name),
    success: (name) => `Unbanned ${name}`,
  });
  const addIpBanMutation = useOptimisticPlayersMutation<{ ip: string; reason: string | null }>({
    serverId,
    mutate: ({ ip, reason }) => banIp(serverId, ip, reason),
    update: (current, entry) => withAddedEntry(current, "ipBans", entry),
  });
  const removeIpBanMutation = useOptimisticPlayersMutation<string>({
    serverId,
    mutate: (ip) => unbanIp(serverId, ip),
    update: (current, ip) => withoutIpEntry(current, ip),
  });
  const setOpLevelMutation = useOptimisticPlayersMutation<{ name: string; level: number }>({
    serverId,
    mutate: ({ name, level }) => setOpLevel(serverId, name, level),
    update: (current, { name, level }) => {
      const next = current ?? emptyPlayersState;
      return { ...next, ops: next.ops.map((entry) => (normalizeName(entry.name) === normalizeName(name) ? { ...entry, level } : entry)) };
    },
  });
  const toggleWhitelistActiveMutation = useOptimisticPlayersMutation<boolean>({
    serverId,
    mutate: (active) => setWhitelistActive(serverId, active),
    update: (current, active) => ({ ...(current ?? emptyPlayersState), whitelistActive: active }),
  });
  const toggleEnforceWhitelistMutation = useOptimisticPlayersMutation<boolean>({
    serverId,
    mutate: (active) => setEnforceWhitelist(serverId, active),
    update: (current, active) => ({ ...(current ?? emptyPlayersState), enforceWhitelist: active }),
  });
  const kickMutation = useMutation({
    mutationFn: ({ name, reason }: { name: string; reason: string | null }) => kickPlayer(serverId, name, reason),
    onError: (error) => toast.error(error instanceof Error ? error.message : "Operation failed"),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: onlinePlayersKey(serverId) }),
  });

  async function addPlayer(action: "whitelist" | "op" | "ban") {
    const name = addName.trim();
    if (!name) return;
    if (action === "whitelist") await addWhitelistMutation.mutateAsync(name);
    if (action === "op") await addOpMutation.mutateAsync({ name, level: 4 });
    if (action === "ban") await addBanMutation.mutateAsync({ name, reason: null });
    setAddName("");
  }

  async function submitReason() {
    if (!reasonTarget) return;
    const reason = reasonText.trim() || null;
    if (reasonTarget.mode === "kick") await kickMutation.mutateAsync({ name: reasonTarget.name, reason });
    else await addBanMutation.mutateAsync({ name: reasonTarget.name, reason });
    setReasonTarget(null);
    setReasonText("");
  }

  const showLoading = stateQuery.isLoading && players.length === 0;

  return (
    <div className="flex flex-col gap-4">
      {!state.onlineMode ? (
        <div className="rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-xs text-secondary-foreground" role="status">
          Server is in offline mode - player avatars and online identity verification are unavailable.
        </div>
      ) : null}

      {stateQuery.error ? (
        <div className="flex items-center justify-between gap-3 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
          <span>{stateQuery.error instanceof Error ? stateQuery.error.message : "Failed to load player state"}</span>
          <Button size="sm" variant="ghost" onClick={() => void stateQuery.refetch()}>
            Retry
          </Button>
        </div>
      ) : null}

      <div className="grid gap-3 md:grid-cols-4">
        <Stat label="Online now" value={online.length} tone="success" />
        <Stat label="Whitelisted" value={state.whitelist.length} />
        <Stat label="Operators" value={state.ops.length} tone="primary" />
        <Stat label="Banned" value={state.bans.length} tone="danger" />
      </div>

      <ServerPanel>
        <label className="flex items-center justify-between gap-3">
          <span>
            <span className="block text-sm font-medium">{isRunning ? "Whitelist on (runtime)" : "Enforce whitelist"}</span>
            <span className="text-xs text-muted-foreground">
              {isRunning ? "Turns the whitelist on/off live. Resets to the persisted setting on next start." : "Persisted in server.properties - applies on next start."}
            </span>
          </span>
          <input
            checked={isRunning ? state.whitelistActive : state.enforceWhitelist}
            className="size-5 accent-primary"
            type="checkbox"
            onChange={(event) =>
              isRunning ? toggleWhitelistActiveMutation.mutate(event.target.checked) : toggleEnforceWhitelistMutation.mutate(event.target.checked)
            }
          />
        </label>
      </ServerPanel>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-1">
          {filters.map((item) => (
            <button
              className={cn(
                "h-8 rounded-full border border-border bg-muted px-3 text-xs font-semibold text-muted-foreground transition hover:text-secondary-foreground",
                filter === item.id && "border-primary bg-primary/10 text-primary",
              )}
              key={item.id}
              type="button"
              onClick={() => setFilter(item.id)}
            >
              {item.label} <span className="opacity-70">{item.count}</span>
            </button>
          ))}
        </div>
        <Input className="ml-auto max-w-60" placeholder="Search players..." type="search" value={search} onChange={(event) => setSearch(event.target.value)} />
      </div>

      <form
        className="flex flex-wrap items-center gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          void addPlayer("whitelist");
        }}
      >
        <Input className="max-w-72" placeholder="Add a player by name..." value={addName} onChange={(event) => setAddName(event.target.value)} />
        <Button disabled={!addName.trim()} size="sm" type="submit">
          <UserPlus />
          Whitelist
        </Button>
        <Button disabled={!addName.trim()} size="sm" type="button" variant="outline" onClick={() => void addPlayer("op")}>
          <Crown />
          Op
        </Button>
        <Button disabled={!addName.trim()} size="sm" type="button" variant="destructive" onClick={() => void addPlayer("ban")}>
          <Ban />
          Ban
        </Button>
      </form>

      <ServerPanel padded={false}>
        {showLoading ? (
          <div className="p-5 text-center text-sm text-muted-foreground">Loading players...</div>
        ) : (
          <ul className="px-4">
            {filteredPlayers.map((player) => (
              <PlayerRow
                key={player.uuid || player.name}
                name={player.name}
                uuid={player.uuid}
                offlineMode={!state.onlineMode}
                online={player.isOnline}
                subtitle={player.isOnline ? "online" : relativeTime(player.lastSeen) || "never seen"}
              >
                {reasonTarget?.name === player.name ? (
                  <>
                    <Input
                      ref={reasonInputRef}
                      className="h-8 w-48"
                      maxLength={256}
                      placeholder={reasonTarget.mode === "kick" ? "Kick reason..." : "Ban reason..."}
                      value={reasonText}
                      onChange={(event) => setReasonText(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          void submitReason();
                        }
                        if (event.key === "Escape") setReasonTarget(null);
                      }}
                    />
                    <Button size="sm" variant="destructive" onClick={() => void submitReason()}>
                      {reasonTarget.mode === "kick" ? "Kick" : "Ban"}
                    </Button>
                    <Button aria-label="Cancel reason" size="sm" variant="ghost" onClick={() => setReasonTarget(null)}>
                      <X />
                    </Button>
                  </>
                ) : (
                  <>
                    <RoleChip active={player.isWhitelisted} onClick={() => (player.isWhitelisted ? removeWhitelistMutation.mutate(player.name) : addWhitelistMutation.mutate(player.name))}>
                      <ShieldCheck />
                      {player.isWhitelisted ? "Whitelisted" : "Whitelist"}
                    </RoleChip>
                    <RoleChip active={player.isOp} tone="op" onClick={() => (player.isOp ? removeOpMutation.mutate(player.name) : addOpMutation.mutate({ name: player.name, level: 4 }))}>
                      <Crown />
                      {player.isOp ? "Op" : "Op"}
                    </RoleChip>
                    {player.isOp ? (
                      <select
                        className="h-8 rounded-md border border-border bg-background px-2 text-xs text-secondary-foreground disabled:opacity-50"
                        disabled={isRunning}
                        title={isRunning ? "Stop the server to change op level" : "Operator level"}
                        value={player.opLevel}
                        onChange={(event) => setOpLevelMutation.mutate({ name: player.name, level: Number(event.target.value) })}
                      >
                        {[1, 2, 3, 4].map((level) => (
                          <option key={level} value={level}>
                            L{level}
                          </option>
                        ))}
                      </select>
                    ) : null}
                    {player.isOnline ? (
                      <Button size="sm" variant="ghost" onClick={() => setReasonTarget({ name: player.name, mode: "kick" })}>
                        Kick
                      </Button>
                    ) : null}
                    {player.isBanned ? (
                      <Button size="sm" variant="ghost" onClick={() => removeBanMutation.mutate(player.name)}>
                        Unban
                      </Button>
                    ) : (
                      <Button size="sm" variant="destructive" onClick={() => setReasonTarget({ name: player.name, mode: "ban" })}>
                        Ban
                      </Button>
                    )}
                  </>
                )}
              </PlayerRow>
            ))}
            {filteredPlayers.length === 0 ? <li className="p-5 text-center text-sm text-muted-foreground">{emptyMessage()}</li> : null}
          </ul>
        )}
      </ServerPanel>

      <IpBansPanel
        ipBans={state.ipBans}
        onAdd={(ip, reason) => addIpBanMutation.mutateAsync({ ip, reason }).then(() => undefined)}
        onRemove={(ip) => removeIpBanMutation.mutateAsync(ip).then(() => undefined)}
      />
    </div>
  );
}

function Stat({ label, value, tone = "muted" }: { label: string; value: number; tone?: "muted" | "success" | "primary" | "danger" }) {
  return (
    <ServerPanel>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs uppercase tracking-normal text-muted-foreground">{label}</span>
        <Badge variant={tone === "muted" ? "muted" : "outline"} className={cn(tone === "success" && "text-success", tone === "primary" && "text-primary", tone === "danger" && "text-destructive")}>
          {value}
        </Badge>
      </div>
      <div className="mt-2 text-2xl font-semibold tabular-nums">{value}</div>
    </ServerPanel>
  );
}

function RoleChip({ active, tone, children, onClick }: { active: boolean; tone?: "op"; children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      className={cn(
        "inline-flex h-7 items-center gap-1 rounded-full border border-border bg-muted px-2 text-xs font-semibold text-muted-foreground transition hover:text-secondary-foreground",
        active && tone === "op" && "border-primary/40 bg-primary/10 text-primary",
        active && tone !== "op" && "border-success/40 bg-success/10 text-success",
      )}
      type="button"
      onClick={onClick}
    >
      {children}
    </button>
  );
}
