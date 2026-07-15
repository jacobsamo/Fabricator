import { queryOptions, useMutation } from "@tanstack/react-query";

import * as serversApi from "@/api/servers";
import { queryClient } from "@/lib/query-client";
import { queryKeys } from "@/lib/query-keys";

export const serversQuery = queryOptions({
  queryKey: queryKeys.session.servers,
  queryFn: serversApi.getServers,
});

export function serverQuery(serverId: string) {
  return queryOptions({
    queryKey: queryKeys.session.server(serverId),
    queryFn: () => serversApi.getServer(serverId),
    refetchInterval: 2500,
  });
}

export function serverMetricsQuery(serverId: string) {
  return queryOptions({
    queryKey: queryKeys.session.serverMetrics(serverId),
    queryFn: () => serversApi.getServerMetrics(serverId),
    refetchInterval: 5000,
  });
}

export const systemMetricsQuery = queryOptions({
  queryKey: queryKeys.session.systemMetrics,
  queryFn: serversApi.getSystemMetrics,
  refetchInterval: 5000,
});

export function serverLogsQuery(serverId: string, limit = 200, offset = 0) {
  return queryOptions({
    queryKey: queryKeys.session.serverLogs(serverId, limit, offset),
    queryFn: () => serversApi.getServerLogs(serverId, { limit, offset }),
    refetchInterval: 4000,
  });
}

export function installedModsQuery(serverId: string) {
  return queryOptions({
    queryKey: queryKeys.session.serverMods(serverId),
    queryFn: () => serversApi.getInstalledMods(serverId),
    refetchInterval: 10_000,
  });
}

export function serverFilesQuery(serverId: string, path: string) {
  return queryOptions({
    queryKey: queryKeys.session.serverFiles(serverId, path),
    queryFn: () => serversApi.browseServerFiles(serverId, path),
  });
}

export function serverFileQuery(serverId: string, path: string) {
  return queryOptions({
    queryKey: queryKeys.session.serverFile(serverId, path),
    queryFn: () => serversApi.getServerFile(serverId, path),
    enabled: Boolean(path),
  });
}

export function serverInstallProgressQuery(serverId: string) {
  return queryOptions({
    queryKey: queryKeys.session.serverAction(serverId),
    queryFn: () => serversApi.getServerInstallProgress(serverId),
    refetchInterval: 1000,
  });
}

function invalidateServer(serverId: string) {
  void queryClient.invalidateQueries({ queryKey: queryKeys.session.servers });
  void queryClient.invalidateQueries({ queryKey: queryKeys.session.server(serverId) });
}

function invalidateServerFiles(serverId: string) {
  void queryClient.invalidateQueries({ queryKey: queryKeys.session.serverFilesRoot(serverId) });
  void queryClient.invalidateQueries({ queryKey: queryKeys.session.serverFileRoot(serverId) });
}

export function useCreateServerMutation() {
  return useMutation({
    mutationFn: serversApi.createServer,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.session.servers });
    },
  });
}

export function useUpdateServerSettingsMutation(serverId: string) {
  return useMutation({
    mutationFn: (settings: serversApi.ServerSettingsPayload) => serversApi.updateServerSettings(serverId, settings),
    onSuccess: () => invalidateServer(serverId),
  });
}

export function useSetServerAutoStartMutation(serverId: string) {
  return useMutation({
    mutationFn: (mode: serversApi.AutoStartMode) => serversApi.setServerAutoStart(serverId, mode),
    onSuccess: () => invalidateServer(serverId),
  });
}

export function useDeleteServerMutation(serverId: string) {
  return useMutation({
    mutationFn: () => serversApi.deleteServer(serverId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.session.servers });
      queryClient.removeQueries({ queryKey: queryKeys.session.server(serverId) });
    },
  });
}

export function useServerActionMutation(serverId: string, action: "start" | "stop" | "restart" | "install") {
  const mutationFnByAction = {
    start: serversApi.startServer,
    stop: serversApi.stopServer,
    restart: serversApi.restartServer,
    install: serversApi.installServer,
  };
  return useMutation({
    mutationFn: () => mutationFnByAction[action](serverId),
    onSuccess: () => {
      invalidateServer(serverId);
      void queryClient.invalidateQueries({ queryKey: queryKeys.session.serverLogs(serverId, 200) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.session.serverAction(serverId) });
    },
  });
}

export function useSendServerCommandMutation(serverId: string) {
  return useMutation({
    mutationFn: (command: string) => serversApi.sendServerCommand(serverId, command),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.session.serverLogs(serverId, 200) });
    },
  });
}

export function useSaveServerFileMutation(serverId: string) {
  return useMutation({
    mutationFn: ({ path, content }: { path: string; content: string }) => serversApi.saveServerFile(serverId, path, content),
    onSuccess: (_result, variables) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.session.serverFile(serverId, variables.path) });
      invalidateServerFiles(serverId);
    },
  });
}

export function useRemoveModMutation(serverId: string) {
  return useMutation({
    mutationFn: (modName: string) => serversApi.removeMod(serverId, modName),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.session.serverMods(serverId) });
    },
  });
}

export function useBulkRemoveModsMutation(serverId: string) {
  return useMutation({
    mutationFn: (filenames: string[]) => serversApi.bulkRemoveMods(serverId, filenames),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.session.serverMods(serverId) });
    },
  });
}
