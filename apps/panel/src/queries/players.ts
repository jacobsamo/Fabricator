import { queryOptions, useMutation } from "@tanstack/react-query";

import * as playersApi from "@/api/players";
import { queryClient } from "@/lib/query-client";
import { queryKeys } from "@/lib/query-keys";

export function playersStateQuery(serverId: string) {
  return queryOptions({
    queryKey: queryKeys.session.players.state(serverId),
    queryFn: () => playersApi.getPlayersState(serverId),
  });
}

export function onlinePlayersQuery(serverId: string, enabled = true) {
  return queryOptions({
    queryKey: queryKeys.session.players.online(serverId),
    queryFn: () => playersApi.getOnlinePlayers(serverId),
    enabled,
    refetchInterval: enabled ? 5000 : false,
  });
}

function invalidatePlayers(serverId: string) {
  void queryClient.invalidateQueries({ queryKey: queryKeys.session.players.state(serverId) });
  void queryClient.invalidateQueries({ queryKey: queryKeys.session.players.online(serverId) });
}

export function useAddToWhitelistMutation(serverId: string) {
  return useMutation({
    mutationFn: (name: string) => playersApi.addToWhitelist(serverId, name),
    onSuccess: () => invalidatePlayers(serverId),
  });
}

export function useRemoveFromWhitelistMutation(serverId: string) {
  return useMutation({
    mutationFn: (name: string) => playersApi.removeFromWhitelist(serverId, name),
    onSuccess: () => invalidatePlayers(serverId),
  });
}

export function useSetWhitelistActiveMutation(serverId: string) {
  return useMutation({
    mutationFn: (active: boolean) => playersApi.setWhitelistActive(serverId, active),
    onSuccess: () => invalidatePlayers(serverId),
  });
}

export function useAddOpMutation(serverId: string) {
  return useMutation({
    mutationFn: ({ name, level }: { name: string; level?: number }) => playersApi.addOp(serverId, name, level),
    onSuccess: () => invalidatePlayers(serverId),
  });
}

export function useSetOpLevelMutation(serverId: string) {
  return useMutation({
    mutationFn: ({ name, level }: { name: string; level: number }) => playersApi.setOpLevel(serverId, name, level),
    onSuccess: () => invalidatePlayers(serverId),
  });
}

export function useRemoveOpMutation(serverId: string) {
  return useMutation({
    mutationFn: (name: string) => playersApi.removeOp(serverId, name),
    onSuccess: () => invalidatePlayers(serverId),
  });
}

export function useBanPlayerMutation(serverId: string) {
  return useMutation({
    mutationFn: ({ name, reason }: { name: string; reason?: string | null }) => playersApi.banPlayer(serverId, name, reason),
    onSuccess: () => invalidatePlayers(serverId),
  });
}

export function useUnbanPlayerMutation(serverId: string) {
  return useMutation({
    mutationFn: (name: string) => playersApi.unbanPlayer(serverId, name),
    onSuccess: () => invalidatePlayers(serverId),
  });
}

export function useKickPlayerMutation(serverId: string) {
  return useMutation({
    mutationFn: ({ name, reason }: { name: string; reason?: string | null }) => playersApi.kickPlayer(serverId, name, reason ?? null),
    onSuccess: () => invalidatePlayers(serverId),
  });
}

export function useBanIpMutation(serverId: string) {
  return useMutation({
    mutationFn: ({ ip, reason }: { ip: string; reason?: string | null }) => playersApi.banIp(serverId, ip, reason ?? null),
    onSuccess: () => invalidatePlayers(serverId),
  });
}

export function useUnbanIpMutation(serverId: string) {
  return useMutation({
    mutationFn: (ip: string) => playersApi.unbanIp(serverId, ip),
    onSuccess: () => invalidatePlayers(serverId),
  });
}

export function useSetEnforceWhitelistMutation(serverId: string) {
  return useMutation({
    mutationFn: (active: boolean) => playersApi.setEnforceWhitelist(serverId, active),
    onSuccess: () => invalidatePlayers(serverId),
  });
}
