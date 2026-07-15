import { queryOptions, useMutation } from "@tanstack/react-query";

import * as serversApi from "@/api/servers";
import { queryClient } from "@/lib/query-client";
import { queryKeys } from "@/lib/query-keys";

export function javaStatusQuery(options: serversApi.JavaStatusOptions = {}) {
  return queryOptions({
    queryKey: queryKeys.session.java.status(options),
    queryFn: () => serversApi.getJavaStatus(options),
  });
}

export const installedJavaQuery = queryOptions({
  queryKey: queryKeys.session.java.installed,
  queryFn: serversApi.getInstalledJava,
});

export function javaInstallProgressQuery(taskId: string) {
  return queryOptions({
    queryKey: queryKeys.session.java.installProgress(taskId),
    queryFn: () => serversApi.getJavaInstallProgress(taskId),
    enabled: Boolean(taskId),
    refetchInterval: 1000,
  });
}

export function loaderGameVersionsQuery(loader: string) {
  return queryOptions({
    queryKey: queryKeys.session.java.loaderGameVersions(loader),
    queryFn: () => serversApi.getLoaderGameVersions(loader),
    enabled: Boolean(loader),
  });
}

export function loaderVersionsQuery(loader: string, mcVersion?: string) {
  return queryOptions({
    queryKey: queryKeys.session.java.loaderVersions(loader, mcVersion),
    queryFn: () => serversApi.getLoaderVersions(loader, mcVersion),
    enabled: Boolean(loader),
  });
}

export function useInstallJavaMutation() {
  return useMutation({
    mutationFn: serversApi.installJava,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.session.java.installed });
    },
  });
}

export function useUninstallJavaMutation() {
  return useMutation({
    mutationFn: serversApi.uninstallJava,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.session.java.installed });
    },
  });
}
