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

export const authErrorFixtures = {
  statusFailure: {
    error: "Unable to reach auth status.",
  },
  loginFailure: {
    error: "Incorrect password.",
  },
  setupFailure: {
    error: "Unable to create operator password.",
  },
  expiredSession: {
    error: "Session expired.",
  },
};

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
    autoStart: "never",
    difficulty: "normal",
    gamemode: "survival",
    maxPlayers: 20,
    motd: "Fabricator fixture server",
    pvp: true,
  },
  running: {
    id: "survival",
    name: "Survival",
    loader: "fabric",
    status: "running",
    version: "1.21.4",
    port: 25565,
    memory: 4,
    maxPlayers: 20,
    runtime: {
      status: "running",
      uptime: "2h 14m",
      cpu: 42,
      ram: { usedGB: 1.5, limitGB: 4 },
      players: { online: 3, max: 20 },
    },
    players: { online: 3, max: 20 },
    modpack: { name: "Better MC", projectId: "better-mc", version: "v32" },
  },
  stopped: {
    id: "survival",
    name: "Survival",
    loader: "fabric",
    status: "stopped",
    version: "1.21.4",
    port: 25565,
    memory: 4,
    maxPlayers: 20,
    runtime: { status: "stopped", players: { online: 0, max: 20 } },
  },
  pending: {
    id: "survival",
    name: "Survival",
    loader: "fabric",
    status: "pending",
    version: "1.21.4",
    port: 25565,
    memory: 4,
    maxPlayers: 20,
    runtime: { status: "stopped" },
  },
  installing: {
    id: "survival",
    name: "Survival",
    loader: "fabric",
    status: "installing",
    version: "1.21.4",
    runtime: { status: "stopped" },
  },
  failed: {
    id: "survival",
    name: "Survival",
    loader: "fabric",
    status: "failed",
    version: "1.21.4",
    runtime: { status: "stopped" },
  },
  apiError: {
    error: "Failed to load servers",
  },
};

export const logFixtures = {
  recent: {
    stdout: [
      { ts: "2026-07-15T00:00:00Z", text: "[00:00:00] [Server thread/INFO]: Starting minecraft server" },
      { ts: "2026-07-15T00:00:03Z", text: "[00:00:03] [Server thread/INFO]: Done (2.34s)! For help, type \"help\"" },
    ],
    stderr: [],
    running: true,
  },
  mixed: {
    stdout: [
      { ts: "2026-07-15T00:00:03Z", text: "[00:00:03] [Server thread/INFO]: Done (2.34s)! For help, type \"help\"" },
      { ts: "2026-07-15T00:00:01Z", text: "[00:00:01] [Server thread/WARN]: Missing config value" },
    ],
    stderr: [
      { ts: "2026-07-15T00:00:02Z", text: "SEVERE: Port already in use" },
      "Plain stderr without level",
    ],
    running: true,
  },
};

export const fileFixtures = {
  root: {
    currentPath: "",
    absolutePath: "/srv/fabricator/servers/survival",
    entries: [
      { name: "world", path: "/srv/fabricator/servers/survival/world", relativePath: "world", isDir: true, size: 4096, updatedAt: "2026-07-14T03:00:00Z" },
      { name: "server.properties", path: "/srv/fabricator/servers/survival/server.properties", relativePath: "server.properties", isDir: false, size: 1820, updatedAt: "2026-07-14T03:01:00Z" },
      { name: "server.jar", path: "/srv/fabricator/servers/survival/server.jar", relativePath: "server.jar", isDir: false, size: 123456, updatedAt: "2026-07-14T03:02:00Z" },
    ],
  },
  world: {
    currentPath: "world",
    absolutePath: "/srv/fabricator/servers/survival/world",
    entries: [],
  },
  content: {
    path: "server.properties",
    content: "motd=Fabricator fixture server\nmax-players=20\n",
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
    {
      id: "daily",
      name: "Daily",
      storagePath: "/srv/fabricator/backups",
      maxSnapshots: 7,
      flush: true,
      shutdown: false,
      compress: true,
      exclusions: ["logs/**"],
      schedule: { enabled: true, frequencyHours: 24, timeOfDay: "03:00" },
    },
  ],
  summary: {
    snapshotCount: 3,
    totalBytes: 8_192_000,
    lastSnapshotAt: "2026-07-14T03:00:00Z",
    nextRunAt: "2026-07-16T03:00:00Z",
    defaultStoragePath: "/srv/fabricator/backups",
  },
  snapshots: [
    {
      id: "snap-1",
      configId: "daily",
      fileName: "daily-2026-07-14.tar",
      message: "Daily 2026-07-14",
      type: "backup",
      createdAt: "2026-07-14T03:00:00Z",
      sizeBytes: 4_096_000,
      durationSeconds: 12,
    },
  ],
  jobStart: { job_id: "job-1" },
  jobRunning: { id: "job-1", active: true, phase: "running", progress: 50 },
  jobDone: { id: "job-1", active: false, phase: "done", progress: 100 },
  retainedDelete: { deleted_files: 0, retained_files: 2, retained_paths: ["/srv/fabricator/backups/daily-1.tar"] },
  purgedDelete: { deleted_files: 2, retained_files: 0, retained_paths: [] },
};

export const playitFixtures = {
  status: {
    status: "running",
    claim_url: null,
    error_reason: null,
    binary_verified: true,
    tunnels_known: true,
    tunnels: [
      { local_port: 25565, address: "survival.fixture.playit.gg", disabled_reason: null, name: "Survival", tunnel_type: "minecraft-java" },
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
  installed: {
    system: { installed: true, version: "21.0.5", path: "/usr/bin/java" },
    managed: [
      { major: 17, version: "17.0.13", path: "/srv/fabricator/java/17/bin/java" },
    ],
  },
  installTask: { task_id: "java-21", install_major: 21 },
  installProgress: { task_id: "java-21", status: "done", downloaded: 104_857_600, total: 104_857_600, install_major: 21 },
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
