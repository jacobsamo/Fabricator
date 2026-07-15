import { queryOptions, useMutation } from "@tanstack/react-query";

import * as modrinthApi from "@/api/modrinth";
import { queryClient } from "@/lib/query-client";
import { queryKeys } from "@/lib/query-keys";

export function modrinthModsSearchQuery(params: modrinthApi.ModrinthSearchParams) {
  return queryOptions({
    queryKey: queryKeys.session.modrinth.modsSearch(params),
    queryFn: ({ signal }) => modrinthApi.searchMods(params, { signal }),
  });
}

export function modDetailsQuery(modId: string) {
  return queryOptions({
    queryKey: queryKeys.session.modrinth.modDetails(modId),
    queryFn: ({ signal }) => modrinthApi.getModDetails(modId, { signal }),
    enabled: Boolean(modId),
  });
}

export function modVersionsQuery(modId: string, filters: Record<string, string> = {}) {
  return queryOptions({
    queryKey: queryKeys.session.modrinth.modVersions(modId, filters),
    queryFn: ({ signal }) => modrinthApi.getModVersions(modId, filters, { signal }),
    enabled: Boolean(modId),
  });
}

export const modrinthCategoriesQuery = queryOptions({
  queryKey: queryKeys.session.modrinth.categories,
  queryFn: modrinthApi.getCategories,
  staleTime: 60 * 60 * 1000,
});

export const modrinthLoadersQuery = queryOptions({
  queryKey: queryKeys.session.modrinth.loaders,
  queryFn: modrinthApi.getLoaders,
  staleTime: 60 * 60 * 1000,
});

export const modrinthGameVersionsQuery = queryOptions({
  queryKey: queryKeys.session.modrinth.gameVersions,
  queryFn: modrinthApi.getGameVersions,
  staleTime: 60 * 60 * 1000,
});

export function modrinthModpacksSearchQuery(params: modrinthApi.ModrinthSearchParams) {
  return queryOptions({
    queryKey: queryKeys.session.modrinth.modpacksSearch(params),
    queryFn: () => modrinthApi.searchModpacks(params),
  });
}

export function projectDetailsQuery(projectIdOrSlug: string) {
  return queryOptions({
    queryKey: queryKeys.session.modrinth.project(projectIdOrSlug),
    queryFn: () => modrinthApi.getProjectDetails(projectIdOrSlug),
    enabled: Boolean(projectIdOrSlug),
  });
}

export function projectVersionQuery(projectId: string, filters: Pick<modrinthApi.ModInstallPayload, "mc_version" | "loader">) {
  return queryOptions({
    queryKey: queryKeys.session.modrinth.projectVersion(projectId, filters),
    queryFn: () => modrinthApi.resolveProjectVersion(projectId, filters),
    enabled: Boolean(projectId && filters.mc_version && filters.loader),
  });
}

export function modpackInstallProgressQuery(serverId: string) {
  return queryOptions({
    queryKey: queryKeys.session.modrinth.modpackInstallProgress(serverId),
    queryFn: () => modrinthApi.getModpackInstallProgress(serverId),
    enabled: Boolean(serverId),
    refetchInterval: 1000,
  });
}

export function useInstallModMutation(serverId: string) {
  return useMutation({
    mutationFn: ({ modId, payload }: { modId: string; payload: Omit<modrinthApi.ModInstallPayload, "server_id"> }) =>
      modrinthApi.installMod(modId, { ...payload, server_id: serverId }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.session.serverMods(serverId) });
    },
  });
}

export function useInstallModpackMutation(serverId: string) {
  return useMutation({
    mutationFn: ({ projectId, payload }: { projectId: string; payload: Omit<modrinthApi.ModpackInstallPayload, "server_id"> }) =>
      modrinthApi.installModpack(projectId, { ...payload, server_id: serverId }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.session.serverMods(serverId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.session.server(serverId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.session.modrinth.modpackInstallProgress(serverId) });
    },
  });
}
