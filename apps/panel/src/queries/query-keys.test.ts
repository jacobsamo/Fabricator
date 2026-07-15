import { describe, expect, it } from "vitest";

import { isSessionQueryKey, queryKeys } from "@/lib/query-keys";

describe("queryKeys", () => {
  it("keeps auth and protected session data under separate roots", () => {
    expect(queryKeys.auth.status).toEqual(["auth", "status"]);
    expect(queryKeys.session.servers).toEqual(["session", "servers"]);
    expect(isSessionQueryKey(queryKeys.auth.status)).toBe(false);
    expect(isSessionQueryKey(queryKeys.session.servers)).toBe(true);
  });

  it("owns every server feature under the session root", () => {
    const serverId = "alpha";
    const keys = [
      queryKeys.session.server(serverId),
      queryKeys.session.serverMetrics(serverId),
      queryKeys.session.serverLogs(serverId, 200),
      queryKeys.session.serverFiles(serverId, "world"),
      queryKeys.session.serverFile(serverId, "server.properties"),
      queryKeys.session.serverMods(serverId),
      queryKeys.session.players.state(serverId),
      queryKeys.session.players.online(serverId),
      queryKeys.session.backups.configs(serverId),
      queryKeys.session.backups.snapshots(serverId),
      queryKeys.session.backups.summary(serverId),
      queryKeys.session.modrinth.modpackInstallProgress(serverId),
    ];

    expect(keys.every(isSessionQueryKey)).toBe(true);
  });

  it("exposes root keys for targeted invalidation without raw arrays", () => {
    expect(queryKeys.session.serverFilesRoot("alpha")).toEqual(["session", "server", "alpha", "files"]);
    expect(queryKeys.session.serverFileRoot("alpha")).toEqual(["session", "server", "alpha", "file"]);
    expect(queryKeys.session.update.status).toEqual(queryKeys.session.updateStatus);
  });
});
