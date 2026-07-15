import { get } from "@/api/client";
import { serversSchema, type ServerSummary } from "@/api/schemas";

export async function getServers() {
  return serversSchema.parse(await get<ServerSummary[]>("/api/servers"));
}

export async function getServer(serverId: string) {
  return await get<ServerSummary>(`/api/servers/${serverId}`);
}
