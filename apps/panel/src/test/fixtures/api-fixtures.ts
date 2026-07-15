import type { ServerSummary } from "@/api/schemas";

type RawAuthStatus = {
  authenticated: boolean;
  enabled: boolean;
  needs_setup: boolean;
};

export const authFixtures = {
  authenticated: {
    authenticated: true,
    enabled: true,
    needs_setup: false,
  },
  unauthenticated: {
    authenticated: false,
    enabled: true,
    needs_setup: false,
  },
  needsSetup: {
    authenticated: false,
    enabled: true,
    needs_setup: true,
  },
  disabled: {
    authenticated: false,
    enabled: false,
    needs_setup: false,
  },
} satisfies Record<string, RawAuthStatus>;

export const serverFixtures = {
  empty: [] satisfies ServerSummary[],
  summaries: [
    {
      id: "survival",
      name: "Survival",
      loader: "fabric",
      status: "running",
      version: "1.21.4",
    },
    {
      id: "creative",
      name: "Creative",
      loader: "vanilla",
      status: "stopped",
      version: "1.20.6",
    },
  ] satisfies ServerSummary[],
  detail: {
    id: "survival",
    name: "Survival",
    loader: "fabric",
    status: "running",
    version: "1.21.4",
    port: 25565,
    memory: "4G",
    path: "/srv/fabricator/servers/survival",
    autostart: "manual",
    settings: {
      difficulty: "normal",
      gamemode: "survival",
      maxPlayers: 20,
      motd: "Fabricator fixture server",
      pvp: true,
    },
  },
  installing: {
    id: "installing",
    name: "Installing",
    loader: "fabric",
    status: "installing",
    version: "1.21.4",
  },
};

export const logFixtures = {
  recent: [
    { id: "1", timestamp: "2026-07-15T00:00:00Z", stream: "stdout", level: "info", message: "Starting minecraft server" },
    { id: "2", timestamp: "2026-07-15T00:00:03Z", stream: "stdout", level: "info", message: "Done (2.34s)! For help, type \"help\"" },
  ],
};

export const fileFixtures = {
  root: {
    path: "",
    entries: [
      { name: "world", path: "world", type: "directory" },
      { name: "server.properties", path: "server.properties", type: "file", size: 1820, editable: true },
    ],
  },
  content: {
    path: "server.properties",
    content: "motd=Fabricator fixture server\nmax-players=20\n",
    editable: true,
  },
};

export const modFixtures = {
  installed: [
    { filename: "fabric-api.jar", name: "Fabric API", version: "0.119.2+1.21.4", side: "both", enabled: true },
    { filename: "lithium.jar", name: "Lithium", version: "0.14.7", side: "server", enabled: true },
  ],
  modrinthSearch: {
    hits: [
      { project_id: "P7dR8mSH", slug: "fabric-api", title: "Fabric API", author: "modmuss50", downloads: 123456789 },
    ],
    offset: 0,
    limit: 20,
    total_hits: 1,
  },
  categories: [{ name: "Optimization", project_type: "mod" }],
  loaders: [{ name: "fabric" }, { name: "vanilla" }],
  gameVersions: [{ version: "1.21.4", version_type: "release" }],
  installProgress: { active: false, step: "idle", progress: 100 },
};

export const playerFixtures = {
  state: {
    whitelistEnabled: true,
    enforceWhitelist: false,
    whitelist: [{ name: "Alex", uuid: "00000000-0000-0000-0000-000000000001" }],
    ops: [{ name: "Steve", uuid: "00000000-0000-0000-0000-000000000002", level: 4 }],
    bans: [],
    ipBans: [],
  },
  online: [
    { name: "Alex", uuid: "00000000-0000-0000-0000-000000000001", latency: 42 },
  ],
};

export const backupFixtures = {
  configs: [
    { id: "daily", name: "Daily", enabled: true, schedule: "0 3 * * *", retention: 7, compress: true },
  ],
  summary: {
    snapshotCount: 3,
    totalBytes: 8_192_000,
    lastSnapshotAt: "2026-07-14T03:00:00Z",
    nextRunAt: "2026-07-16T03:00:00Z",
  },
  snapshots: [
    { id: "snap-1", name: "Daily 2026-07-14", createdAt: "2026-07-14T03:00:00Z", sizeBytes: 4_096_000, status: "complete" },
  ],
  job: { id: "job-1", status: "complete", progress: 100, message: "Backup complete" },
};

export const playitFixtures = {
  status: {
    supported: true,
    installed: true,
    running: true,
    claimed: true,
    tunnels: [
      { id: "tun-1", name: "Survival", domain: "fixture.playit.gg", port: 25565, serverId: "survival" },
    ],
  },
};

export const javaFixtures = {
  status: {
    available: true,
    requiredMajor: 21,
    system: { available: true, version: "21.0.5", path: "/usr/bin/java" },
    managed: [],
  },
  installed: [
    { major: 21, version: "21.0.5", path: "/srv/fabricator/java/21/bin/java" },
  ],
  installProgress: { taskId: "java-21", status: "complete", progress: 100 },
};

export const updateFixtures = {
  status: {
    currentVersion: "0.4.0",
    latestVersion: "0.4.1",
    updateAvailable: true,
    channel: "stable",
    checkedAt: "2026-07-15T00:00:00Z",
  },
  started: { ok: true, version: "0.4.1", jobId: "update-1" },
};
