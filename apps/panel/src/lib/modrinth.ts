import { get, post } from "@/api/client";

export type ModrinthSearchHit = {
  project_id: string;
  slug?: string;
  title: string;
  description?: string;
  icon_url?: string | null;
  downloads?: number;
  author?: string;
  versions?: string[];
  latest_version?: string;
};

export type ModrinthSearchResult = {
  hits: ModrinthSearchHit[];
  total_hits?: number;
};

export type InstallModOptions = {
  mc_version?: string;
  loader?: string;
  server_id: string;
};

export type InstallModpackOptions = InstallModOptions & {
  clean_install?: boolean;
  create_backup?: boolean;
  allow_missing?: boolean;
  mod_side_overrides?: Record<string, "server" | "client"> | null;
};

export function searchMods(params: { query?: string; version?: string; loader?: string; sort?: string; limit?: number; offset?: number }) {
  return get<ModrinthSearchResult>("/api/modrinth/search", {
    query: params.query || "",
    mc_version: params.version || "",
    loader: params.loader || "",
    index: params.sort || "relevance",
    limit: params.limit ?? 20,
    offset: params.offset ?? 0,
  });
}

export function searchModpacks(params: { query?: string; version?: string; loader?: string; sort?: string; limit?: number; offset?: number }) {
  return get<ModrinthSearchResult>("/api/modrinth/modpacks/search", {
    query: params.query || "",
    mc_version: params.version || "",
    loader: params.loader || "",
    index: params.sort || "relevance",
    limit: Math.min(params.limit ?? 8, 50),
    offset: params.offset ?? 0,
  });
}

export function installMod(projectId: string, options: InstallModOptions) {
  return post<{ success?: boolean; message?: string; file?: string }>(`/api/modrinth/mod/${encodeURIComponent(projectId)}/install`, {
    mc_version: options.mc_version,
    loader: options.loader,
    server_id: options.server_id,
  });
}

export function installModpack(projectId: string, options: InstallModpackOptions) {
  return post<{ success?: boolean; message?: string }>(`/api/modrinth/modpack/${encodeURIComponent(projectId)}/install`, {
    mc_version: options.mc_version,
    loader: options.loader,
    server_id: options.server_id,
    clean_install: options.clean_install ?? true,
    create_backup: options.create_backup ?? true,
    allow_missing: options.allow_missing ?? false,
    mod_side_overrides: options.mod_side_overrides ?? null,
  });
}
