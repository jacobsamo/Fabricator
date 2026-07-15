import { get, post } from "@/api/client";
import {
  modrinthCategoriesSchema,
  modrinthGameVersionsSchema,
  modrinthInstallProgressSchema,
  modrinthLoadersSchema,
  modrinthProjectSchema,
  modrinthSearchSchema,
  modrinthVersionsSchema,
  mutationResultSchema,
  type MutationResult,
} from "@/api/schemas";

export type ModrinthSearchParams = {
  query?: string;
  version?: string;
  loader?: string;
  sort?: string;
  limit?: number;
  offset?: number;
};

export type ModInstallPayload = {
  mc_version: string;
  loader: string;
  server_id: string;
};

export type ModpackInstallPayload = ModInstallPayload & {
  clean_install?: boolean;
  create_backup?: boolean;
  allow_missing?: boolean;
  mod_side_overrides?: Record<string, unknown> | null;
};

export type RequestSignalOptions = { signal?: AbortSignal };

export async function searchMods(
  { query = "", version = "", loader = "", sort = "relevance", limit = 20, offset = 0 }: ModrinthSearchParams,
  options: RequestSignalOptions = {},
) {
  return modrinthSearchSchema.parse(
    await get(
      "/api/modrinth/search",
      { query, mc_version: version, loader, index: sort, limit, offset },
      { signal: options.signal },
    ),
  );
}

export async function getModDetails(modId: string, options: RequestSignalOptions = {}) {
  return modrinthProjectSchema.parse(await get(`/api/modrinth/mod/${modId}`, {}, { signal: options.signal }));
}

export async function getModVersions(modId: string, filters: Record<string, string> = {}, options: RequestSignalOptions = {}) {
  return modrinthVersionsSchema.parse(await get(`/api/modrinth/mod/${modId}/versions`, filters, { signal: options.signal }));
}

export async function installMod(modId: string, { mc_version, loader, server_id }: ModInstallPayload) {
  return mutationResultSchema.parse(await post<MutationResult>(`/api/modrinth/mod/${modId}/install`, { mc_version, loader, server_id }));
}

export async function getCategories() {
  return modrinthCategoriesSchema.parse(await get("/api/modrinth/categories"));
}

export async function getLoaders() {
  return modrinthLoadersSchema.parse(await get("/api/modrinth/loaders"));
}

export async function getGameVersions() {
  return modrinthGameVersionsSchema.parse(await get("/api/modrinth/game-versions"));
}

export async function searchModpacks(
  { query = "", version = "", loader = "", sort = "relevance", limit = 8, offset = 0 }: ModrinthSearchParams,
) {
  return modrinthSearchSchema.parse(
    await get("/api/modrinth/modpacks/search", {
      query,
      mc_version: version,
      loader,
      index: sort,
      limit: Math.min(limit, 50),
      offset,
    }),
  );
}

export async function getProjectDetails(projectIdOrSlug: string) {
  return modrinthProjectSchema.parse(await get(`/api/modrinth/project/${encodeURIComponent(projectIdOrSlug)}`));
}

export async function resolveProjectVersion(projectId: string, { mc_version, loader }: Pick<ModInstallPayload, "mc_version" | "loader">) {
  return modrinthProjectSchema.parse(
    await get(`/api/modrinth/project/${encodeURIComponent(projectId)}/resolve-version`, { mc_version, loader }),
  );
}

export async function getModpackInstallProgress(serverId: string) {
  return modrinthInstallProgressSchema.parse(await get(`/api/modrinth/modpack/install-progress/${encodeURIComponent(serverId)}`));
}

export async function installModpack(
  projectId: string,
  {
    mc_version,
    loader,
    server_id,
    clean_install = false,
    create_backup = false,
    allow_missing = false,
    mod_side_overrides = null,
  }: ModpackInstallPayload,
) {
  return mutationResultSchema.parse(
    await post<MutationResult>(`/api/modrinth/modpack/${encodeURIComponent(projectId)}/install`, {
      mc_version,
      loader,
      server_id,
      clean_install,
      create_backup,
      allow_missing,
      mod_side_overrides,
    }),
  );
}
