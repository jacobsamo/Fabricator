export const queryKeys = {
  auth: {
    all: ["auth"] as const,
    status: ["auth", "status"] as const,
  },
  session: {
    all: ["session"] as const,
    servers: ["session", "servers"] as const,
    server: (serverId: string) => ["session", "server", serverId] as const,
    serverAction: (serverId: string) => ["session", "server", serverId, "action"] as const,
    serverMetrics: (serverId: string) => ["session", "server", serverId, "metrics"] as const,
    systemMetrics: ["session", "metrics", "system"] as const,
    updateStatus: ["session", "system", "update", "status"] as const,
    serverLogs: (serverId: string, limit: number, offset = 0) => ["session", "server", serverId, "logs", { limit, offset }] as const,
    serverFilesRoot: (serverId: string) => ["session", "server", serverId, "files"] as const,
    serverFiles: (serverId: string, path: string) => ["session", "server", serverId, "files", path] as const,
    serverFileRoot: (serverId: string) => ["session", "server", serverId, "file"] as const,
    serverFile: (serverId: string, path: string) => ["session", "server", serverId, "file", path] as const,
    serverMods: (serverId: string) => ["session", "server", serverId, "mods"] as const,
    modrinth: {
      all: ["session", "modrinth"] as const,
      modsSearch: (params: unknown) => ["session", "modrinth", "mods", "search", params] as const,
      modDetails: (modId: string) => ["session", "modrinth", "mods", modId] as const,
      modVersions: (modId: string, filters: unknown) => ["session", "modrinth", "mods", modId, "versions", filters] as const,
      categories: ["session", "modrinth", "categories"] as const,
      loaders: ["session", "modrinth", "loaders"] as const,
      gameVersions: ["session", "modrinth", "game-versions"] as const,
      modpacksSearch: (params: unknown) => ["session", "modrinth", "modpacks", "search", params] as const,
      project: (projectId: string) => ["session", "modrinth", "project", projectId] as const,
      projectVersion: (projectId: string, filters: unknown) => ["session", "modrinth", "project", projectId, "resolve-version", filters] as const,
      modpackInstallProgress: (serverId: string) => ["session", "server", serverId, "modpack-install-progress"] as const,
    },
    players: {
      state: (serverId: string) => ["session", "server", serverId, "players", "state"] as const,
      online: (serverId: string) => ["session", "server", serverId, "players", "online"] as const,
    },
    backups: {
      configs: (serverId: string) => ["session", "server", serverId, "backup-configs"] as const,
      snapshots: (serverId: string) => ["session", "server", serverId, "snapshots"] as const,
      summary: (serverId: string) => ["session", "server", serverId, "backup-summary"] as const,
      job: (jobId: string) => ["session", "backup-jobs", jobId] as const,
    },
    playit: {
      status: ["session", "playit", "status"] as const,
    },
    java: {
      status: (options: unknown) => ["session", "java", "status", options] as const,
      installed: ["session", "java", "installed"] as const,
      installProgress: (taskId: string) => ["session", "java", "install-progress", taskId] as const,
      loaderGameVersions: (loader: string) => ["session", "loaders", loader, "versions", "game"] as const,
      loaderVersions: (loader: string, mcVersion?: string) => ["session", "loaders", loader, "versions", "loader", mcVersion ?? null] as const,
    },
    update: {
      status: ["session", "system", "update", "status"] as const,
    },
  },
};

export function isSessionQueryKey(queryKey: readonly unknown[]) {
  return queryKey[0] === queryKeys.session.all[0];
}
