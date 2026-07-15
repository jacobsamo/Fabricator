import { del, get, post, put } from "@/api/client";
import {
  fileBrowserSchema,
  fileContentSchema,
  installProgressSchema,
  installedJavaSchema,
  installedModsSchema,
  javaInstallProgressSchema,
  javaInstallTaskSchema,
  javaStatusSchema,
  loaderGameVersionsSchema,
  loaderVersionsSchema,
  metricsSchema,
  mutationResultSchema,
  serverDetailSchema,
  serverLogsSchema,
  serversSchema,
  systemMetricsSchema,
  updateStatusSchema,
  updateTriggerResultSchema,
  type FileBrowser,
  type FileContent,
  type InstalledMod,
  type MutationResult,
  type ServerDetail,
  type ServerLogs,
  type ServerSummary,
} from "@/api/schemas";

export type CreateServerPayload = {
  name: string;
  version: string;
  loader: string;
  port: number;
  maxPlayers: number;
  difficulty: string;
  gamemode: string;
  memory: number;
  [key: string]: unknown;
};

export type ServerSettingsPayload = Record<string, unknown>;
export type AutoStartMode = "always" | "never" | "last";
export type LogOptions = { limit?: number; offset?: number };
export type JavaStatusOptions = {
  mcVersion?: string;
  requiredJava?: number;
  javaPath?: string;
};

export async function getServers() {
  return serversSchema.parse(await get<ServerSummary[]>("/api/servers"));
}

export async function getServer(serverId: string) {
  return serverDetailSchema.parse(await get<ServerDetail>(`/api/servers/${serverId}`));
}

export async function createServer(serverData: CreateServerPayload) {
  return serverDetailSchema.parse(await post<ServerDetail>("/api/servers", serverData));
}

export async function updateServerSettings(serverId: string, settings: ServerSettingsPayload) {
  return serverDetailSchema.parse(await put<ServerDetail>(`/api/servers/${serverId}/settings`, settings));
}

export async function setServerAutoStart(serverId: string, mode: AutoStartMode) {
  return serverDetailSchema.parse(await put<ServerDetail>(`/api/servers/${serverId}/autostart`, { mode }));
}

export async function deleteServer(serverId: string) {
  return mutationResultSchema.parse(await del<MutationResult>(`/api/servers/${serverId}`));
}

export async function startServer(serverId: string) {
  return mutationResultSchema.parse(await post<MutationResult>(`/api/servers/${serverId}/start`));
}

export async function stopServer(serverId: string) {
  return mutationResultSchema.parse(await post<MutationResult>(`/api/servers/${serverId}/stop`));
}

export async function restartServer(serverId: string) {
  return mutationResultSchema.parse(await post<MutationResult>(`/api/servers/${serverId}/restart`));
}

export async function installServer(serverId: string) {
  return mutationResultSchema.parse(await post<MutationResult>(`/api/servers/${serverId}/install`));
}

export async function browseServerFiles(serverId: string, path = "") {
  return fileBrowserSchema.parse(await get<FileBrowser>(`/api/servers/${serverId}/files`, path ? { path } : {}));
}

export async function getServerFile(serverId: string, path: string) {
  return fileContentSchema.parse(await get<FileContent>(`/api/servers/${serverId}/files/content`, { path }));
}

export async function saveServerFile(serverId: string, path: string, content: string) {
  return mutationResultSchema.parse(await put<MutationResult>(`/api/servers/${serverId}/files/content`, { path, content }));
}

export async function getServerLogs(serverId: string, { limit = 200, offset = 0 }: LogOptions = {}) {
  return serverLogsSchema.parse(await get<ServerLogs>(`/api/servers/${serverId}/logs`, { limit, offset }));
}

export async function sendServerCommand(serverId: string, command: string) {
  return mutationResultSchema.parse(await post<MutationResult>(`/api/servers/${serverId}/console`, { command }));
}

export async function getInstalledMods(serverId: string) {
  return installedModsSchema.parse(await get<InstalledMod[]>(`/api/servers/${serverId}/mods`));
}

export async function removeMod(serverId: string, modName: string) {
  return mutationResultSchema.parse(await del<MutationResult>(`/api/servers/${serverId}/mods/${encodeURIComponent(modName)}`));
}

export async function bulkRemoveMods(serverId: string, filenames: string[]) {
  return mutationResultSchema.parse(await del<MutationResult>(`/api/servers/${serverId}/mods`, { filenames }));
}

export async function getServerMetrics(serverId: string) {
  return metricsSchema.parse(await get(`/api/servers/${serverId}/metrics`));
}

export async function getServerInstallProgress(serverId: string) {
  return installProgressSchema.parse(await get(`/api/servers/${encodeURIComponent(serverId)}/install/progress`));
}

export async function getLoaderGameVersions(loader: string) {
  return loaderGameVersionsSchema.parse(await get(`/api/loaders/${encodeURIComponent(loader)}/versions/game`));
}

export async function getLoaderVersions(loader: string, mcVersion?: string) {
  const params = mcVersion ? { mc_version: mcVersion } : {};
  return loaderVersionsSchema.parse(await get(`/api/loaders/${encodeURIComponent(loader)}/versions/loader`, params));
}

export async function getSystemMetrics() {
  return systemMetricsSchema.parse(await get("/api/metrics/system"));
}

export async function getJavaStatus(options: JavaStatusOptions = {}) {
  return javaStatusSchema.parse(
    await get("/api/java/status", {
      mc_version: options.mcVersion,
      required_java: options.requiredJava,
      java_path: options.javaPath,
    }),
  );
}

export async function installJava(major: number) {
  return javaInstallTaskSchema.parse(await post("/api/java/install", { major }));
}

export async function getJavaInstallProgress(taskId: string) {
  return javaInstallProgressSchema.parse(await get(`/api/java/install/progress/${taskId}`));
}

export async function getInstalledJava() {
  return installedJavaSchema.parse(await get("/api/java/installed"));
}

export async function uninstallJava(major: number) {
  return mutationResultSchema.parse(await del<MutationResult>(`/api/java/installed/${major}`));
}

export async function getUpdateStatus() {
  return updateStatusSchema.parse(await get("/api/system/update/status"));
}

export async function triggerUpdate(version = "latest") {
  return updateTriggerResultSchema.parse(await post("/api/system/update", { version }));
}
