import { http, HttpResponse } from "msw";

import {
  authFixtures,
  backupFixtures,
  fileFixtures,
  javaFixtures,
  logFixtures,
  modFixtures,
  playerFixtures,
  playitFixtures,
  serverFixtures,
  updateFixtures,
} from "@/test/fixtures";

type PanelApiFixtureOverrides = {
  authStatus?: unknown;
  authStatusError?: { status?: number; body?: unknown };
  loginError?: { status?: number; body?: unknown };
  setupError?: { status?: number; body?: unknown };
  logoutError?: { status?: number; body?: unknown };
  servers?: unknown[];
  serversError?: { status?: number; body?: unknown };
  serverDetail?: unknown;
  serverDetailError?: { status?: number; body?: unknown };
  playersState?: unknown;
  onlinePlayers?: unknown;
  installedMods?: unknown;
  modrinthSearch?: unknown;
  backupConfigs?: unknown[];
  backupSnapshots?: unknown[];
  backupSummary?: unknown;
  backupJob?: unknown;
  backupDeleteConfig?: unknown;
  playitStatus?: unknown;
  javaInstalled?: unknown;
  javaInstallProgress?: unknown;
  logs?: unknown;
  files?: Record<string, unknown>;
  fileContent?: unknown;
  saveFileError?: { status?: number; body?: unknown };
  onRequest?: (request: Request) => void;
  changePasswordError?: { status?: number; body?: unknown };
  autostartError?: { status?: number; body?: unknown };
  updateSettingsError?: { status?: number; body?: unknown };
};

const ok = { ok: true };

function errorResponse(error: { status?: number; body?: unknown }) {
  return HttpResponse.json(error.body ?? { error: "Request failed" }, { status: error.status ?? 500 });
}

export function createPanelApiHandlers(overrides: PanelApiFixtureOverrides = {}) {
  const authStatus = overrides.authStatus ?? authFixtures.authenticated;
  const servers = overrides.servers ?? serverFixtures.summaries;
  const serverDetail = overrides.serverDetail ?? serverFixtures.detail;
  const playersState = overrides.playersState ?? playerFixtures.state;
  const onlinePlayers = overrides.onlinePlayers ?? playerFixtures.online;
  const installedMods = overrides.installedMods ?? modFixtures.installed;
  const modrinthSearch = overrides.modrinthSearch ?? modFixtures.modrinthSearch;
  const backupConfigs = overrides.backupConfigs ?? backupFixtures.configs;
  const backupSnapshots = overrides.backupSnapshots ?? backupFixtures.snapshots;
  const backupSummary = overrides.backupSummary ?? backupFixtures.summary;
  const backupJob = overrides.backupJob ?? backupFixtures.jobDone;
  const playitStatus = overrides.playitStatus ?? playitFixtures.status;
  let playitSnapshot = { ...(playitStatus as Record<string, unknown>) };
  const javaInstalled = overrides.javaInstalled ?? javaFixtures.installed;
  const javaInstallProgress = overrides.javaInstallProgress ?? javaFixtures.installProgress;
  const logs = overrides.logs ?? logFixtures.recent;
  const files = overrides.files ?? { "": fileFixtures.root, world: fileFixtures.world };
  const fileContent = overrides.fileContent ?? fileFixtures.content;
  const track = (request: Request) => overrides.onRequest?.(request);

  return [
    http.get("/api/auth/status", ({ request }) => {
      track(request);
      if (overrides.authStatusError) return errorResponse(overrides.authStatusError);
      return HttpResponse.json(authStatus);
    }),
    http.post("/api/auth/login", async ({ request }) => {
      track(request);
      if (overrides.loginError) return errorResponse(overrides.loginError);
      const body = await request.json().catch(() => ({}));
      if (typeof body === "object" && body && "password" in body && body.password === "wrong-password") {
        return HttpResponse.json({ error: "Incorrect password." }, { status: 401 });
      }
      return HttpResponse.json({ authenticated: true });
    }),
    http.post("/api/auth/setup", ({ request }) => {
      track(request);
      if (overrides.setupError) return errorResponse(overrides.setupError);
      return HttpResponse.json({ authenticated: true });
    }),
    http.post("/api/auth/logout", ({ request }) => {
      track(request);
      if (overrides.logoutError) return errorResponse(overrides.logoutError);
      return HttpResponse.json({ authenticated: false });
    }),
    http.post("/api/auth/change-password", ({ request }) => {
      track(request);
      if (overrides.changePasswordError) return errorResponse(overrides.changePasswordError);
      return HttpResponse.json(ok);
    }),

    http.get("/api/servers", ({ request }) => {
      track(request);
      if (overrides.serversError) return errorResponse(overrides.serversError);
      return HttpResponse.json(servers);
    }),
    http.post("/api/servers", ({ request }) => {
      track(request);
      return HttpResponse.json(serverFixtures.detail, { status: 201 });
    }),
    http.get("/api/servers/:serverId", ({ request }) => {
      track(request);
      if (overrides.serverDetailError) return errorResponse(overrides.serverDetailError);
      return HttpResponse.json(serverDetail);
    }),
    http.put("/api/servers/:serverId/settings", () => {
      if (overrides.updateSettingsError) return errorResponse(overrides.updateSettingsError);
      return HttpResponse.json(serverDetail);
    }),
    http.put("/api/servers/:serverId/autostart", async ({ request }) => {
      if (overrides.autostartError) return errorResponse(overrides.autostartError);
      const body = await request.json().catch(() => ({}));
      const mode = typeof body === "object" && body && "mode" in body ? body.mode : "never";
      return HttpResponse.json({ ...(serverDetail as Record<string, unknown>), autoStart: mode });
    }),
    http.delete("/api/servers/:serverId", () => HttpResponse.json(ok)),
    http.post("/api/servers/:serverId/start", () => HttpResponse.json(ok)),
    http.post("/api/servers/:serverId/stop", () => HttpResponse.json(ok)),
    http.post("/api/servers/:serverId/restart", () => HttpResponse.json(ok)),
    http.post("/api/servers/:serverId/install", ({ request }) => {
      track(request);
      return HttpResponse.json(ok);
    }),
    http.get("/api/servers/:serverId/install/progress", () => HttpResponse.json({ active: false, progress: 100 })),
    http.get("/api/servers/:serverId/metrics", () => HttpResponse.json({ cpuPercent: 12, memoryBytes: 512_000_000 })),

    http.get("/api/servers/:serverId/logs", ({ request }) => {
      track(request);
      return HttpResponse.json(logs);
    }),
    http.post("/api/servers/:serverId/console", () => HttpResponse.json(ok)),
    http.get("/api/servers/:serverId/files", ({ request }) => {
      track(request);
      const path = new URL(request.url).searchParams.get("path") ?? "";
      return HttpResponse.json(files[path] ?? { currentPath: path, entries: [] });
    }),
    http.get("/api/servers/:serverId/files/content", ({ request }) => {
      track(request);
      return HttpResponse.json(fileContent);
    }),
    http.put("/api/servers/:serverId/files/content", ({ request }) => {
      track(request);
      if (overrides.saveFileError) return errorResponse(overrides.saveFileError);
      return HttpResponse.json(ok);
    }),
    http.get("/api/servers/:serverId/mods", () => HttpResponse.json(installedMods)),
    http.delete("/api/servers/:serverId/mods/:modName", () => HttpResponse.json(ok)),
    http.delete("/api/servers/:serverId/mods", () => HttpResponse.json(ok)),

    http.get("/api/servers/:serverId/players/state", () => HttpResponse.json(playersState)),
    http.get("/api/servers/:serverId/players/online", () => HttpResponse.json(onlinePlayers)),
    http.post("/api/servers/:serverId/players/whitelist", () => HttpResponse.json(ok)),
    http.delete("/api/servers/:serverId/players/whitelist", () => HttpResponse.json(ok)),
    http.patch("/api/servers/:serverId/players/whitelist/active", () => HttpResponse.json(ok)),
    http.post("/api/servers/:serverId/players/ops", () => HttpResponse.json(ok)),
    http.patch("/api/servers/:serverId/players/ops", () => HttpResponse.json(ok)),
    http.delete("/api/servers/:serverId/players/ops", () => HttpResponse.json(ok)),
    http.post("/api/servers/:serverId/players/bans", () => HttpResponse.json(ok)),
    http.delete("/api/servers/:serverId/players/bans", () => HttpResponse.json(ok)),
    http.post("/api/servers/:serverId/players/kick", () => HttpResponse.json(ok)),
    http.post("/api/servers/:serverId/players/bans/ip", () => HttpResponse.json(ok)),
    http.delete("/api/servers/:serverId/players/bans/ip", () => HttpResponse.json(ok)),
    http.patch("/api/servers/:serverId/players/whitelist/enforce", () => HttpResponse.json(ok)),

    http.get("/api/servers/:serverId/backup-configs", () => HttpResponse.json(backupConfigs)),
    http.post("/api/servers/:serverId/backup-configs", async ({ request }) => HttpResponse.json({ id: "created", ...((await request.json().catch(() => ({}))) as Record<string, unknown>) }, { status: 201 })),
    http.put("/api/servers/:serverId/backup-configs/:configId", async ({ params, request }) => HttpResponse.json({ id: params.configId, ...((await request.json().catch(() => ({}))) as Record<string, unknown>) })),
    http.delete("/api/servers/:serverId/backup-configs/:configId", ({ request }) => {
      if (overrides.backupDeleteConfig) return HttpResponse.json(overrides.backupDeleteConfig);
      const url = new URL(request.url);
      return HttpResponse.json(url.searchParams.get("purge") === "1" ? backupFixtures.purgedDelete : backupFixtures.retainedDelete);
    }),
    http.get("/api/servers/:serverId/snapshots", () => HttpResponse.json(backupSnapshots)),
    http.delete("/api/servers/:serverId/snapshots/:snapshotId", () => HttpResponse.json(ok)),
    http.post("/api/servers/:serverId/snapshots/:snapshotId/restore", () => HttpResponse.json(backupFixtures.jobStart)),
    http.get("/api/servers/:serverId/backup-summary", () => HttpResponse.json(backupSummary)),
    http.post("/api/servers/:serverId/backup-configs/:configId/run", () => HttpResponse.json(backupFixtures.jobStart)),
    http.post("/api/servers/:serverId/backup-quick", () => HttpResponse.json(backupFixtures.jobStart)),
    http.get("/api/backup-jobs/:jobId", () => HttpResponse.json(backupJob)),
    http.post("/api/servers/:serverId/world-import", () => HttpResponse.json(backupFixtures.jobStart)),

    http.get("/api/playit/status", () => HttpResponse.json(playitSnapshot)),
    http.post("/api/playit/start", () => {
      playitSnapshot = { ...playitSnapshot, status: "starting" };
      return HttpResponse.json(playitSnapshot);
    }),
    http.post("/api/playit/stop", () => {
      playitSnapshot = { ...playitSnapshot, status: "stopped", tunnels: [] };
      return HttpResponse.json(playitSnapshot);
    }),
    http.post("/api/playit/reset", () => {
      playitSnapshot = { ...playitSnapshot, status: "stopped", claim_url: null, tunnels: [] };
      return HttpResponse.json(playitSnapshot);
    }),

    http.get("/api/java/status", () => HttpResponse.json(javaFixtures.status)),
    http.post("/api/java/install", () => HttpResponse.json(javaFixtures.installTask)),
    http.get("/api/java/install/progress/:taskId", () => HttpResponse.json(javaInstallProgress)),
    http.get("/api/java/installed", () => HttpResponse.json(javaInstalled)),
    http.delete("/api/java/installed/:major", () => HttpResponse.json(ok)),

    http.get("/api/system/update/status", () => HttpResponse.json(updateFixtures.status)),
    http.post("/api/system/update", () => HttpResponse.json(updateFixtures.started)),

    http.get("/api/loaders/:loader/versions/game", () => HttpResponse.json([{ version: "1.21.4" }, { version: "1.20.6" }])),
    http.get("/api/loaders/:loader/versions/loader", () => HttpResponse.json(["0.16.10", "0.15.11"])),
    http.get("/api/metrics/system", () => HttpResponse.json({ cpuPercent: 7, memoryPercent: 41 })),

    http.get("/api/modrinth/search", () => HttpResponse.json(modrinthSearch)),
    http.get("/api/modrinth/mod/:modId", () => HttpResponse.json(modFixtures.modrinthSearch.hits[0])),
    http.get("/api/modrinth/mod/:modId/versions", () => HttpResponse.json([{ id: "version-1", version_number: "1.0.0" }])),
    http.post("/api/modrinth/mod/:modId/install", () => HttpResponse.json(ok)),
    http.get("/api/modrinth/categories", () => HttpResponse.json(modFixtures.categories)),
    http.get("/api/modrinth/loaders", () => HttpResponse.json(modFixtures.loaders)),
    http.get("/api/modrinth/game-versions", () => HttpResponse.json(modFixtures.gameVersions)),
    http.get("/api/modrinth/modpacks/search", () => HttpResponse.json(modrinthSearch)),
    http.get("/api/modrinth/project/:projectId", () => HttpResponse.json(modFixtures.modrinthSearch.hits[0])),
    http.get("/api/modrinth/project/:projectId/resolve-version", () => HttpResponse.json({ versionId: "version-1" })),
    http.get("/api/modrinth/modpack/install-progress/:serverId", () => HttpResponse.json(modFixtures.installProgress)),
    http.post("/api/modrinth/modpack/:projectId/install", () => HttpResponse.json({ jobId: "modpack-1" })),
  ];
}

export type { PanelApiFixtureOverrides };
