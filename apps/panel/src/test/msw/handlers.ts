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
  servers?: unknown[];
  serverDetail?: unknown;
};

const ok = { ok: true };

export function createPanelApiHandlers(overrides: PanelApiFixtureOverrides = {}) {
  const authStatus = overrides.authStatus ?? authFixtures.authenticated;
  const servers = overrides.servers ?? serverFixtures.summaries;
  const serverDetail = overrides.serverDetail ?? serverFixtures.detail;

  return [
    http.get("/api/auth/status", () => HttpResponse.json(authStatus)),
    http.post("/api/auth/login", async ({ request }) => {
      const body = await request.json().catch(() => ({}));
      if (typeof body === "object" && body && "password" in body && body.password === "wrong-password") {
        return HttpResponse.json({ error: "Incorrect password." }, { status: 401 });
      }
      return HttpResponse.json({ authenticated: true });
    }),
    http.post("/api/auth/setup", () => HttpResponse.json({ authenticated: true })),
    http.post("/api/auth/logout", () => HttpResponse.json({ authenticated: false })),
    http.post("/api/auth/change-password", () => HttpResponse.json(ok)),

    http.get("/api/servers", () => HttpResponse.json(servers)),
    http.post("/api/servers", () => HttpResponse.json(serverFixtures.detail, { status: 201 })),
    http.get("/api/servers/:serverId", () => HttpResponse.json(serverDetail)),
    http.put("/api/servers/:serverId/settings", () => HttpResponse.json(ok)),
    http.put("/api/servers/:serverId/autostart", () => HttpResponse.json(ok)),
    http.delete("/api/servers/:serverId", () => HttpResponse.json(ok)),
    http.post("/api/servers/:serverId/start", () => HttpResponse.json(ok)),
    http.post("/api/servers/:serverId/stop", () => HttpResponse.json(ok)),
    http.post("/api/servers/:serverId/restart", () => HttpResponse.json(ok)),
    http.post("/api/servers/:serverId/install", () => HttpResponse.json(ok)),
    http.get("/api/servers/:serverId/install/progress", () => HttpResponse.json({ active: false, progress: 100 })),
    http.get("/api/servers/:serverId/metrics", () => HttpResponse.json({ cpuPercent: 12, memoryBytes: 512_000_000 })),

    http.get("/api/servers/:serverId/logs", () => HttpResponse.json(logFixtures.recent)),
    http.post("/api/servers/:serverId/console", () => HttpResponse.json(ok)),
    http.get("/api/servers/:serverId/files", () => HttpResponse.json(fileFixtures.root)),
    http.get("/api/servers/:serverId/files/content", () => HttpResponse.json(fileFixtures.content)),
    http.put("/api/servers/:serverId/files/content", () => HttpResponse.json(ok)),
    http.get("/api/servers/:serverId/mods", () => HttpResponse.json(modFixtures.installed)),
    http.delete("/api/servers/:serverId/mods/:modName", () => HttpResponse.json(ok)),
    http.delete("/api/servers/:serverId/mods", () => HttpResponse.json(ok)),

    http.get("/api/servers/:serverId/players/state", () => HttpResponse.json(playerFixtures.state)),
    http.get("/api/servers/:serverId/players/online", () => HttpResponse.json(playerFixtures.online)),
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

    http.get("/api/servers/:serverId/backup-configs", () => HttpResponse.json(backupFixtures.configs)),
    http.post("/api/servers/:serverId/backup-configs", () => HttpResponse.json(backupFixtures.configs[0], { status: 201 })),
    http.put("/api/servers/:serverId/backup-configs/:configId", () => HttpResponse.json(backupFixtures.configs[0])),
    http.delete("/api/servers/:serverId/backup-configs/:configId", () => HttpResponse.json(ok)),
    http.get("/api/servers/:serverId/snapshots", () => HttpResponse.json(backupFixtures.snapshots)),
    http.delete("/api/servers/:serverId/snapshots/:snapshotId", () => HttpResponse.json(ok)),
    http.post("/api/servers/:serverId/snapshots/:snapshotId/restore", () => HttpResponse.json(backupFixtures.job)),
    http.get("/api/servers/:serverId/backup-summary", () => HttpResponse.json(backupFixtures.summary)),
    http.post("/api/servers/:serverId/backup-configs/:configId/run", () => HttpResponse.json(backupFixtures.job)),
    http.post("/api/servers/:serverId/backup-quick", () => HttpResponse.json(backupFixtures.job)),
    http.get("/api/backup-jobs/:jobId", () => HttpResponse.json(backupFixtures.job)),
    http.post("/api/servers/:serverId/world-import", () => HttpResponse.json(backupFixtures.job)),

    http.get("/api/playit/status", () => HttpResponse.json(playitFixtures.status)),
    http.post("/api/playit/start", () => HttpResponse.json(playitFixtures.status)),
    http.post("/api/playit/stop", () => HttpResponse.json({ ...playitFixtures.status, running: false })),
    http.post("/api/playit/reset", () => HttpResponse.json(ok)),

    http.get("/api/java/status", () => HttpResponse.json(javaFixtures.status)),
    http.post("/api/java/install", () => HttpResponse.json({ taskId: "java-21" })),
    http.get("/api/java/install/progress/:taskId", () => HttpResponse.json(javaFixtures.installProgress)),
    http.get("/api/java/installed", () => HttpResponse.json(javaFixtures.installed)),
    http.delete("/api/java/installed/:major", () => HttpResponse.json(ok)),

    http.get("/api/system/update/status", () => HttpResponse.json(updateFixtures.status)),
    http.post("/api/system/update", () => HttpResponse.json(updateFixtures.started)),

    http.get("/api/loaders/:loader/versions/game", () => HttpResponse.json(["1.21.4", "1.20.6"])),
    http.get("/api/loaders/:loader/versions/loader", () => HttpResponse.json(["0.16.10", "0.15.11"])),
    http.get("/api/metrics/system", () => HttpResponse.json({ cpuPercent: 7, memoryPercent: 41 })),

    http.get("/api/modrinth/search", () => HttpResponse.json(modFixtures.modrinthSearch)),
    http.get("/api/modrinth/mod/:modId", () => HttpResponse.json(modFixtures.modrinthSearch.hits[0])),
    http.get("/api/modrinth/mod/:modId/versions", () => HttpResponse.json([{ id: "version-1", version_number: "1.0.0" }])),
    http.post("/api/modrinth/mod/:modId/install", () => HttpResponse.json(ok)),
    http.get("/api/modrinth/categories", () => HttpResponse.json(modFixtures.categories)),
    http.get("/api/modrinth/loaders", () => HttpResponse.json(modFixtures.loaders)),
    http.get("/api/modrinth/game-versions", () => HttpResponse.json(modFixtures.gameVersions)),
    http.get("/api/modrinth/modpacks/search", () => HttpResponse.json(modFixtures.modrinthSearch)),
    http.get("/api/modrinth/project/:projectId", () => HttpResponse.json(modFixtures.modrinthSearch.hits[0])),
    http.get("/api/modrinth/project/:projectId/resolve-version", () => HttpResponse.json({ versionId: "version-1" })),
    http.get("/api/modrinth/modpack/install-progress/:serverId", () => HttpResponse.json(modFixtures.installProgress)),
    http.post("/api/modrinth/modpack/:projectId/install", () => HttpResponse.json({ jobId: "modpack-1" })),
  ];
}

export type { PanelApiFixtureOverrides };
