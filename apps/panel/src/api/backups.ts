import { del, get, post, put } from "@/api/client";
import {
  backupConfigSchema,
  backupConfigsSchema,
  backupJobSchema,
  backupJobStartSchema,
  backupSummarySchema,
  snapshotsSchema,
} from "@/api/schemas";

export type BackupConfigPayload = {
  name: string;
  storagePath: string;
  maxSnapshots: number;
  flush: boolean;
  shutdown: boolean;
  compress: boolean;
  exclusions: string[];
  schedule: {
    enabled: boolean;
    frequencyHours: number;
    timeOfDay: string;
  };
};

export type QuickBackupPayload = {
  storagePath: string;
  compress: boolean;
  flush: boolean;
  shutdown: boolean;
};

export async function listBackupConfigs(serverId: string) {
  return backupConfigsSchema.parse(await get(`/api/servers/${serverId}/backup-configs`));
}

export async function createBackupConfig(serverId: string, data: BackupConfigPayload) {
  return backupConfigSchema.parse(await post(`/api/servers/${serverId}/backup-configs`, data));
}

export async function updateBackupConfig(serverId: string, configId: string, data: BackupConfigPayload) {
  return backupConfigSchema.parse(await put(`/api/servers/${serverId}/backup-configs/${configId}`, data));
}

export async function deleteBackupConfig(serverId: string, configId: string, { purge = false } = {}) {
  const suffix = purge ? "?purge=1" : "";
  return await del<Record<string, unknown>>(`/api/servers/${serverId}/backup-configs/${configId}${suffix}`);
}

export async function listSnapshots(serverId: string) {
  return snapshotsSchema.parse(await get(`/api/servers/${serverId}/snapshots`));
}

export async function getBackupSummary(serverId: string) {
  return backupSummarySchema.parse(await get(`/api/servers/${serverId}/backup-summary`));
}

export function snapshotDownloadUrl(serverId: string, snapshotId: string, format: "tar" | "zip" = "tar") {
  const base = `/api/servers/${serverId}/snapshots/${snapshotId}/download`;
  return format === "zip" ? `${base}?format=zip` : base;
}

export async function deleteSnapshot(serverId: string, snapshotId: string) {
  return await del<Record<string, unknown>>(`/api/servers/${serverId}/snapshots/${snapshotId}`);
}

export async function runBackupConfig(serverId: string, configId: string) {
  return backupJobStartSchema.parse(await post(`/api/servers/${serverId}/backup-configs/${configId}/run`));
}

export async function runQuickBackup(serverId: string, data: QuickBackupPayload) {
  return backupJobStartSchema.parse(await post(`/api/servers/${serverId}/backup-quick`, data));
}

export async function restoreSnapshot(serverId: string, snapshotId: string, mode: "in_place" | "reset") {
  return backupJobStartSchema.parse(await post(`/api/servers/${serverId}/snapshots/${snapshotId}/restore`, { mode }));
}

export async function getBackupJob(jobId: string) {
  return backupJobSchema.parse(await get(`/api/backup-jobs/${jobId}`));
}

export function uploadWorld(
  serverId: string,
  file: File,
  { onProgress, registerAbort }: { onProgress?: (pct: number) => void; registerAbort?: (abort: () => void) => void } = {},
) {
  return new Promise<{ job_id: string }>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `/api/servers/${serverId}/world-import?filename=${encodeURIComponent(file.name)}`);
    xhr.setRequestHeader("Content-Type", "application/octet-stream");

    registerAbort?.(() => xhr.abort());
    xhr.upload.onprogress = (event) => {
      onProgress?.(event.lengthComputable ? Math.round((event.loaded / event.total) * 100) : -1);
    };
    xhr.onload = () => {
      let data: unknown = {};
      try {
        data = JSON.parse(xhr.responseText || "{}");
      } catch {
        data = {};
      }
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(backupJobStartSchema.parse(data));
      } else {
        const message =
          data && typeof data === "object" && "error" in data
            ? String(data.error)
            : `Upload failed with status ${xhr.status}`;
        reject(new Error(message));
      }
    };
    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.onabort = () => reject(new Error("Upload cancelled"));
    xhr.send(file);
  });
}
