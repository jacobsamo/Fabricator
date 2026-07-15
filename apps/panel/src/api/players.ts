import { del, get, patch, post } from "@/api/client";
import { mutationResultSchema, onlinePlayersSchema, playersStateSchema, type MutationResult } from "@/api/schemas";

export async function getPlayersState(serverId: string) {
  return playersStateSchema.parse(await get(`/api/servers/${serverId}/players/state`));
}

export async function getOnlinePlayers(serverId: string) {
  return onlinePlayersSchema.parse(await get(`/api/servers/${serverId}/players/online`));
}

export async function addToWhitelist(serverId: string, name: string) {
  return mutationResultSchema.parse(await post<MutationResult>(`/api/servers/${serverId}/players/whitelist`, { name }));
}

export async function removeFromWhitelist(serverId: string, name: string) {
  return mutationResultSchema.parse(await del<MutationResult>(`/api/servers/${serverId}/players/whitelist`, { name }));
}

export async function setWhitelistActive(serverId: string, active: boolean) {
  return mutationResultSchema.parse(await patch<MutationResult>(`/api/servers/${serverId}/players/whitelist/active`, { active }));
}

export async function addOp(serverId: string, name: string, level?: number) {
  return mutationResultSchema.parse(await post<MutationResult>(`/api/servers/${serverId}/players/ops`, { name, level }));
}

export async function setOpLevel(serverId: string, name: string, level: number) {
  return mutationResultSchema.parse(await patch<MutationResult>(`/api/servers/${serverId}/players/ops`, { name, level }));
}

export async function removeOp(serverId: string, name: string) {
  return mutationResultSchema.parse(await del<MutationResult>(`/api/servers/${serverId}/players/ops`, { name }));
}

export async function banPlayer(serverId: string, name: string, reason?: string | null) {
  return mutationResultSchema.parse(await post<MutationResult>(`/api/servers/${serverId}/players/bans`, { name, reason }));
}

export async function unbanPlayer(serverId: string, name: string) {
  return mutationResultSchema.parse(await del<MutationResult>(`/api/servers/${serverId}/players/bans`, { name }));
}

export async function kickPlayer(serverId: string, name: string, reason: string | null = null) {
  return mutationResultSchema.parse(
    await post<MutationResult>(`/api/servers/${serverId}/players/kick`, { name, ...(reason ? { reason } : {}) }),
  );
}

export async function banIp(serverId: string, ip: string, reason: string | null = null) {
  return mutationResultSchema.parse(
    await post<MutationResult>(`/api/servers/${serverId}/players/bans/ip`, { ip, ...(reason ? { reason } : {}) }),
  );
}

export async function unbanIp(serverId: string, ip: string) {
  return mutationResultSchema.parse(await del<MutationResult>(`/api/servers/${serverId}/players/bans/ip`, { ip }));
}

export async function setEnforceWhitelist(serverId: string, active: boolean) {
  return mutationResultSchema.parse(await patch<MutationResult>(`/api/servers/${serverId}/players/whitelist/enforce`, { active }));
}
