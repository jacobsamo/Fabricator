import { del } from "@/api/client";
import type { InstalledMod } from "@/api/schemas";

export function installedModFilename(mod: InstalledMod) {
  return mod.relativePath || mod.path || mod.name;
}

export function installedModDisplayName(mod: InstalledMod) {
  const explicitName = typeof mod.name === "string" ? mod.name : "";
  const filename = installedModFilename(mod);
  const raw = explicitName || filename;
  return raw.replace(/\.jar$/i, "");
}

export function installedModInitial(mod: InstalledMod) {
  return installedModDisplayName(mod).trim().slice(0, 1).toUpperCase() || "?";
}

export async function deleteInstalledMod(serverId: string, filename: string) {
  return await del<{ success?: boolean; message?: string }>(`/api/servers/${serverId}/mods/${encodeURIComponent(filename)}`);
}

export async function bulkDeleteInstalledMods(serverId: string, filenames: string[]) {
  return await del<{ success?: boolean; deleted?: string[]; errors?: Array<{ filename: string; error: string }> }>(
    `/api/servers/${serverId}/mods`,
    { filenames },
  );
}
