import { queryOptions, useMutation } from "@tanstack/react-query";

import * as backupsApi from "@/api/backups";
import { queryClient } from "@/lib/query-client";
import { queryKeys } from "@/lib/query-keys";

export function backupConfigsQuery(serverId: string) {
  return queryOptions({
    queryKey: queryKeys.session.backups.configs(serverId),
    queryFn: () => backupsApi.listBackupConfigs(serverId),
  });
}

export function snapshotsQuery(serverId: string) {
  return queryOptions({
    queryKey: queryKeys.session.backups.snapshots(serverId),
    queryFn: () => backupsApi.listSnapshots(serverId),
  });
}

export function backupSummaryQuery(serverId: string) {
  return queryOptions({
    queryKey: queryKeys.session.backups.summary(serverId),
    queryFn: () => backupsApi.getBackupSummary(serverId),
  });
}

export function backupJobQuery(jobId: string | null) {
  return queryOptions({
    queryKey: queryKeys.session.backups.job(jobId || "none"),
    queryFn: () => backupsApi.getBackupJob(jobId || ""),
    enabled: Boolean(jobId),
    refetchInterval: (query) => (query.state.data && query.state.data.active === false ? false : 1000),
  });
}

function invalidateBackups(serverId: string) {
  void queryClient.invalidateQueries({ queryKey: queryKeys.session.backups.configs(serverId) });
  void queryClient.invalidateQueries({ queryKey: queryKeys.session.backups.snapshots(serverId) });
  void queryClient.invalidateQueries({ queryKey: queryKeys.session.backups.summary(serverId) });
}

export function useSaveBackupConfigMutation(serverId: string, configId: string | null) {
  return useMutation({
    mutationFn: (data: backupsApi.BackupConfigPayload) =>
      configId ? backupsApi.updateBackupConfig(serverId, configId, data) : backupsApi.createBackupConfig(serverId, data),
    onSuccess: () => invalidateBackups(serverId),
  });
}

export function useDeleteBackupConfigMutation(serverId: string) {
  return useMutation({
    mutationFn: ({ configId, purge }: { configId: string; purge: boolean }) => backupsApi.deleteBackupConfig(serverId, configId, { purge }),
    onSuccess: () => invalidateBackups(serverId),
  });
}

export function useDeleteSnapshotMutation(serverId: string) {
  return useMutation({
    mutationFn: (snapshotId: string) => backupsApi.deleteSnapshot(serverId, snapshotId),
    onSuccess: () => invalidateBackups(serverId),
  });
}

export function useRunBackupConfigMutation(serverId: string) {
  return useMutation({ mutationFn: (configId: string) => backupsApi.runBackupConfig(serverId, configId) });
}

export function useQuickBackupMutation(serverId: string) {
  return useMutation({ mutationFn: (data: backupsApi.QuickBackupPayload) => backupsApi.runQuickBackup(serverId, data) });
}

export function useRestoreSnapshotMutation(serverId: string) {
  return useMutation({
    mutationFn: ({ snapshotId, mode }: { snapshotId: string; mode: "in_place" | "reset" }) =>
      backupsApi.restoreSnapshot(serverId, snapshotId, mode),
  });
}

export function useUploadWorldMutation(serverId: string) {
  return useMutation({
    mutationFn: (args: { file: File; onProgress: (pct: number) => void; registerAbort: (abort: () => void) => void }) =>
      backupsApi.uploadWorld(serverId, args.file, args),
  });
}
