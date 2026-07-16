import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import { AlertTriangle, Boxes, PackagePlus, PackageSearch } from "lucide-react";
import { toast } from "sonner";

import { ApiError } from "@/api/client";
import type { InstalledMod } from "@/api/schemas";
import { getModDetails, getModVersions, resolveProjectVersion } from "@/api/modrinth";
import { InstalledModsPanel } from "@/components/mods/installed-mods-panel";
import { ModrinthBrowserPanel } from "@/components/modrinth/modrinth-browser-panel";
import { ServerPanel } from "@/components/server/server-panel";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { bulkDeleteInstalledMods, deleteInstalledMod, installedModDisplayName, installedModFilename } from "@/lib/mods";
import {
  installMod,
  installModpack,
  searchModpacks,
  searchMods,
  type ModrinthSearchHit,
  type ModrinthSearchResult,
} from "@/lib/modrinth";
import { queryKeys } from "@/lib/query-keys";
import { serverQuery, installedModsQuery } from "@/queries/servers";
import { modsUiStoreActions, useModsUiStore } from "@/stores/mods-ui-store";

type ActiveModpack = {
  projectId?: string;
  name?: string;
  version?: string;
  mcVersion?: string;
  loaders?: string[];
  installedAt?: string;
};

type ServerWithModpack = {
  loader?: string;
  version?: string;
  status?: string;
  modpack?: ActiveModpack | null;
};

type RecordLike = Record<string, unknown>;

type CompatibilityStatus = "full" | "likely" | "unlikely" | "unknown";

type VersionChoice = {
  id: string;
  label: string;
  mcVersion: string;
};

type MissingDependency = {
  modId: string;
  modTitle: string;
};

type ContinuationFile = {
  path: string;
  reason?: string;
};

type PendingCompatibility = {
  hit: ModrinthSearchHit;
  status: CompatibilityStatus;
  choices: VersionChoice[];
  selectedMcVersion: string;
};

type PendingDependency = {
  hit: ModrinthSearchHit;
  mcVersion: string;
  missing: MissingDependency[];
};

type PendingMissingFiles = {
  hit: ModrinthSearchHit;
  files: ContinuationFile[];
};

type PendingSideDecisions = {
  hit: ModrinthSearchHit;
  files: ContinuationFile[];
  selections: Record<string, "server" | "client" | "">;
};

function useDebouncedValue(value: string, delay = 250) {
  const [debounced, setDebounced] = React.useState(value);
  React.useEffect(() => {
    const handle = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(handle);
  }, [value, delay]);
  return debounced;
}

function filterInstalledMods(mods: InstalledMod[], search: string) {
  const query = search.trim().toLowerCase();
  if (!query) return mods;
  return mods.filter((mod) => {
    const haystack = [installedModDisplayName(mod), installedModFilename(mod), "version" in mod ? String(mod.version) : ""].join(" ").toLowerCase();
    return haystack.includes(query);
  });
}

function hitId(hit: ModrinthSearchHit) {
  return hit.project_id || hit.slug || hit.title;
}

function asRecord(value: unknown): RecordLike | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as RecordLike) : null;
}

function stringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function modrinthVersions(hit: ModrinthSearchHit) {
  const record = hit as unknown as RecordLike;
  return [...stringArray(record.versions), ...stringArray(record.game_versions), ...stringArray(record.version_numbers)];
}

function compatibilityStatus(hit: ModrinthSearchHit, mcVersion: string): CompatibilityStatus {
  const versions = modrinthVersions(hit);
  if (!mcVersion || versions.length === 0) return "unknown";
  if (versions.includes(mcVersion)) return "full";
  const [major, minor] = mcVersion.split(".");
  if (major && minor && versions.some((version) => version.startsWith(`${major}.${minor}.`))) return "likely";
  return "unlikely";
}

function versionMcVersions(version: RecordLike) {
  return stringArray(version.game_versions);
}

function versionChoice(version: RecordLike, fallbackIndex: number, preferredMcVersion: string): VersionChoice | null {
  const mcVersions = versionMcVersions(version);
  const mcVersion = mcVersions.includes(preferredMcVersion) ? preferredMcVersion : mcVersions[0];
  if (!mcVersion) return null;
  const id = String(version.id || version.version_id || version.version_number || `${mcVersion}-${fallbackIndex}`);
  const label = String(version.version_number || version.name || id);
  return { id, label, mcVersion };
}

function dependencyProjectIds(resolved: RecordLike) {
  const version = asRecord(resolved.version) ?? resolved;
  const dependencies = Array.isArray(version.dependencies) ? version.dependencies : [];
  const ids = new Set<string>();
  for (const dependency of dependencies) {
    const record = asRecord(dependency);
    if (!record || record.dependency_type !== "required" || typeof record.project_id !== "string") continue;
    ids.add(record.project_id);
  }
  return [...ids];
}

function normalizedToken(value: unknown) {
  return typeof value === "string" ? value.toLowerCase().replace(/[^a-z0-9]+/g, "") : "";
}

function installedJarMatchesProjectRef(mod: InstalledMod, ref: { id?: unknown; slug?: unknown; title?: unknown }) {
  const haystack = normalizedToken(`${installedModFilename(mod)} ${installedModDisplayName(mod)}`);
  return [ref.id, ref.slug, ref.title].some((value) => {
    const token = normalizedToken(value);
    return token.length > 0 && haystack.includes(token);
  });
}

function jarNameMatchesModrinthProjectId(jarName: string, projectIdOrSlug: unknown) {
  const name = jarName.toLowerCase();
  const id = typeof projectIdOrSlug === "string" ? projectIdOrSlug.toLowerCase() : "";
  if (!name.endsWith(".jar") || id.length < 2) return false;
  if (name === `${id}.jar` || name.startsWith(`${id}-`) || name.startsWith(`${id}_`)) return true;
  const compactId = id.replace(/[-_]/g, "");
  if (compactId.length < 2) return false;
  const flatName = name.replace(/_/g, "");
  return flatName === `${compactId}.jar` || flatName.startsWith(`${compactId}-`);
}

function installedJarMatchesBrowseHit(mod: InstalledMod, hit: ModrinthSearchHit) {
  const jarName = installedModFilename(mod) || installedModDisplayName(mod);
  return [hit.project_id, hit.slug].some((id) => jarNameMatchesModrinthProjectId(jarName, id));
}

function continuationFiles(value: unknown): ContinuationFile[] {
  if (!Array.isArray(value)) return [];
  return value.map((item, index) => {
    if (typeof item === "string") return { path: item };
    const record = asRecord(item);
    return {
      path: String(record?.path || record?.file || record?.name || `file-${index + 1}`),
      reason: typeof record?.reason === "string" ? record.reason : typeof record?.error === "string" ? record.error : undefined,
    };
  });
}

export function ModsPage() {
  const { serverId } = useParams({ from: "/app/server/$serverId" });
  const queryClient = useQueryClient();
  const server = useQuery(serverQuery(serverId));
  const serverData = server.data as ServerWithModpack | undefined;
  const mods = useQuery(installedModsQuery(serverId));
  const searchText = useModsUiStore((state) => state.searchText);
  const selectedFilenames = useModsUiStore((state) => state.selectedModFilenames);
  const activeDialog = useModsUiStore((state) => state.activeDialog);
  const [modSearch, setModSearch] = React.useState("");
  const [modpackSearch, setModpackSearch] = React.useState("");
  const [preflightId, setPreflightId] = React.useState<string | null>(null);
  const [pendingCompatibility, setPendingCompatibility] = React.useState<PendingCompatibility | null>(null);
  const [pendingDependency, setPendingDependency] = React.useState<PendingDependency | null>(null);
  const [pendingMissingFiles, setPendingMissingFiles] = React.useState<PendingMissingFiles | null>(null);
  const [pendingSideDecisions, setPendingSideDecisions] = React.useState<PendingSideDecisions | null>(null);
  const debouncedModSearch = useDebouncedValue(modSearch);
  const debouncedModpackSearch = useDebouncedValue(modpackSearch);

  const installedMods = mods.data ?? [];
  const filteredMods = React.useMemo(() => filterInstalledMods(installedMods, searchText), [installedMods, searchText]);
  const filteredFilenames = filteredMods.map(installedModFilename);

  React.useEffect(() => {
    const valid = new Set(installedMods.map(installedModFilename));
    const next = selectedFilenames.filter((filename) => valid.has(filename));
    if (next.length !== selectedFilenames.length) modsUiStoreActions.setSelectedModFilenames(next);
  }, [installedMods, selectedFilenames]);

  const modSearchQuery = useQuery({
    queryKey: ["session", "modrinth", "mods", serverId, debouncedModSearch, serverData?.version, serverData?.loader],
    queryFn: () =>
      searchMods({
        query: debouncedModSearch,
        version: serverData?.version || "",
        loader: serverData?.loader || "",
        sort: "relevance",
        limit: 20,
      }),
    enabled: activeDialog === "mod-browser",
  });

  const modpackSearchQuery = useQuery({
    queryKey: ["session", "modrinth", "modpacks", serverId, debouncedModpackSearch, serverData?.version, serverData?.loader],
    queryFn: () =>
      searchModpacks({
        query: debouncedModpackSearch,
        version: serverData?.version || "",
        loader: serverData?.loader || "",
        sort: "relevance",
        limit: 8,
      }),
    enabled: activeDialog === "modpack-browser",
  });

  const deleteOne = useMutation({
    mutationFn: (mod: InstalledMod) => deleteInstalledMod(serverId, installedModFilename(mod)),
    onMutate: async (mod) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.session.serverMods(serverId) });
      const previous = queryClient.getQueryData<InstalledMod[]>(queryKeys.session.serverMods(serverId));
      queryClient.setQueryData(queryKeys.session.serverMods(serverId), (current: InstalledMod[] = []) =>
        current.filter((item) => installedModFilename(item) !== installedModFilename(mod)),
      );
      return { previous };
    },
    onError: (error, _mod, context) => {
      queryClient.setQueryData(queryKeys.session.serverMods(serverId), context?.previous);
      toast.error(error instanceof Error ? error.message : "Failed to remove mod");
    },
    onSuccess: (_data, mod) => {
      toast.success(`Removed ${installedModDisplayName(mod)}`);
    },
    onSettled: () => void queryClient.invalidateQueries({ queryKey: queryKeys.session.serverMods(serverId) }),
  });

  const deleteSelected = useMutation({
    mutationFn: (filenames: string[]) => bulkDeleteInstalledMods(serverId, filenames),
    onMutate: async (filenames) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.session.serverMods(serverId) });
      const previous = queryClient.getQueryData<InstalledMod[]>(queryKeys.session.serverMods(serverId));
      const toDelete = new Set(filenames);
      queryClient.setQueryData(queryKeys.session.serverMods(serverId), (current: InstalledMod[] = []) =>
        current.filter((item) => !toDelete.has(installedModFilename(item))),
      );
      return { previous };
    },
    onError: (error, _filenames, context) => {
      queryClient.setQueryData(queryKeys.session.serverMods(serverId), context?.previous);
      toast.error(error instanceof Error ? error.message : "Failed to remove selected mods");
    },
    onSuccess: (result) => {
      const deleted = result.deleted?.length ?? selectedFilenames.length;
      const errors = result.errors?.length ?? 0;
      if (errors) toast.warning(`Removed ${deleted} mod files; ${errors} failed.`);
      else toast.success(`Removed ${deleted} mod file${deleted === 1 ? "" : "s"}.`);
      modsUiStoreActions.clearSelection();
    },
    onSettled: () => void queryClient.invalidateQueries({ queryKey: queryKeys.session.serverMods(serverId) }),
  });

  const installModMutation = useMutation({
    mutationFn: async ({ hit, mcVersion, dependencies = [] }: { hit: ModrinthSearchHit; mcVersion: string; dependencies?: MissingDependency[] }) => {
      const loader = (serverData?.loader || "fabric").toLowerCase();
      for (const dependency of dependencies) {
        await installMod(dependency.modId, {
          mc_version: mcVersion,
          loader,
          server_id: serverId,
        });
        await queryClient.invalidateQueries({ queryKey: queryKeys.session.serverMods(serverId) });
      }
      return installMod(hitId(hit), {
        mc_version: mcVersion,
        loader,
        server_id: serverId,
      });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Failed to install mod"),
    onSuccess: (_result, request) => {
      const suffix = request.dependencies?.length ? ` and ${request.dependencies.length} dependenc${request.dependencies.length === 1 ? "y" : "ies"}` : "";
      toast.success(`${request.hit.title} installed${suffix}`);
      void queryClient.invalidateQueries({ queryKey: queryKeys.session.serverMods(serverId) });
    },
  });

  const installModpackMutation = useMutation({
    mutationFn: ({ hit, allowMissing = false, sideOverrides = null }: { hit: ModrinthSearchHit; allowMissing?: boolean; sideOverrides?: Record<string, "server" | "client"> | null }) =>
      installModpack(hitId(hit), {
        mc_version: serverData?.version,
        loader: serverData?.loader,
        server_id: serverId,
        clean_install: !allowMissing && !sideOverrides ? Boolean(serverData?.modpack) : false,
        create_backup: !allowMissing && !sideOverrides,
        allow_missing: allowMissing,
        mod_side_overrides: sideOverrides,
      }),
    onSuccess: (_result, request) => {
      toast.success(`${request.hit.title} modpack install started`);
      void queryClient.invalidateQueries({ queryKey: queryKeys.session.server(serverId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.session.serverMods(serverId) });
    },
  });

  async function loadCompatibilityChoices(hit: ModrinthSearchHit, mcVersion: string) {
    const records = (await getModVersions(hitId(hit), { loaders: (serverData?.loader || "fabric").toLowerCase() })) as RecordLike[];
    const choices = records.map((version, index) => versionChoice(version, index, mcVersion)).filter((choice): choice is VersionChoice => Boolean(choice));
    const preferred = choices.filter((choice) => choice.mcVersion === mcVersion);
    return preferred.length ? preferred : choices;
  }

  async function prepareModInstall(hit: ModrinthSearchHit, mcVersion = serverData?.version || "") {
    const loader = (serverData?.loader || "fabric").toLowerCase();
    try {
      const resolved = await resolveProjectVersion(hitId(hit), { mc_version: mcVersion, loader });
      const missingMap = new Map<string, MissingDependency>();
      for (const projectId of dependencyProjectIds(resolved as RecordLike)) {
        let details: RecordLike = { id: projectId, slug: projectId, title: projectId };
        try {
          details = (await getModDetails(projectId)) as RecordLike;
        } catch {
          // Dependency metadata is helpful, but not required to keep the install flow moving.
        }
        const ref = { id: details.id || projectId, slug: details.slug, title: details.title };
        const installed = installedMods.some((mod) => installedJarMatchesProjectRef(mod, ref));
        if (!installed) {
          const key = String(details.id || projectId);
          missingMap.set(key, {
            modId: key,
            modTitle: String(details.title || details.slug || projectId),
          });
        }
      }
      const missing = [...missingMap.values()];
      if (missing.length > 0) {
        setPendingDependency({ hit, mcVersion, missing });
        return;
      }
    } catch (error) {
      console.warn("Dependency check skipped:", error);
    }

    installModMutation.mutate({ hit, mcVersion });
  }

  async function startModInstall(hit: ModrinthSearchHit) {
    const mcVersion = serverData?.version || "";
    setPreflightId(hitId(hit));
    try {
      const status = compatibilityStatus(hit, mcVersion);
      if (status !== "full") {
        const choices = await loadCompatibilityChoices(hit, mcVersion);
        if (choices.length > 0) {
          setPendingCompatibility({ hit, status, choices, selectedMcVersion: choices[0].mcVersion });
          return;
        }
      }
      await prepareModInstall(hit, mcVersion);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to check mod compatibility");
    } finally {
      setPreflightId(null);
    }
  }

  async function runModpackInstall(
    hit: ModrinthSearchHit,
    continuation: { allowMissing?: boolean; sideOverrides?: Record<string, "server" | "client"> | null } = {},
  ) {
    try {
      await installModpackMutation.mutateAsync({
        hit,
        allowMissing: continuation.allowMissing,
        sideOverrides: continuation.sideOverrides ?? null,
      });
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        const data = asRecord(error.data);
        const uncertain = continuationFiles(data?.uncertain_mod_files);
        if (data?.can_continue_with_uncertain === true && uncertain.length > 0) {
          setPendingSideDecisions({
            hit,
            files: uncertain,
            selections: Object.fromEntries(uncertain.map((file) => [file.path, ""])),
          });
          return;
        }
        const missing = continuationFiles(data?.missing_files);
        if (data?.can_continue_with_missing === true && missing.length > 0) {
          setPendingMissingFiles({ hit, files: missing });
          return;
        }
      }
      toast.error(error instanceof Error ? error.message : "Failed to install modpack");
    }
  }

  function isModInstalled(hit: ModrinthSearchHit) {
    return installedMods.some((mod) => installedJarMatchesBrowseHit(mod, hit));
  }

  function toggleAll() {
    const allSelected = filteredFilenames.length > 0 && filteredFilenames.every((filename) => selectedFilenames.includes(filename));
    modsUiStoreActions.setSelectedModFilenames(allSelected ? [] : filteredFilenames);
  }

  function removeOne(mod: InstalledMod) {
    if (!window.confirm(`Delete ${installedModDisplayName(mod)} from this server?`)) return;
    deleteOne.mutate(mod);
  }

  function removeSelected() {
    if (!selectedFilenames.length) return;
    if (!window.confirm(`Delete ${selectedFilenames.length} selected mod file${selectedFilenames.length === 1 ? "" : "s"}?`)) return;
    deleteSelected.mutate(selectedFilenames);
  }

  const activeModpack = serverData?.modpack;
  const installingId = installModMutation.variables
    ? hitId(installModMutation.variables.hit)
    : installModpackMutation.variables
      ? hitId(installModpackMutation.variables.hit)
      : preflightId;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Mods</h2>
          <p className="text-sm text-muted-foreground">Manage installed mod files and add compatible Modrinth projects.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => modsUiStoreActions.setActiveDialog("modpack-browser")}>
            <Boxes />
            Browse modpacks
          </Button>
          <Button onClick={() => modsUiStoreActions.setActiveDialog("mod-browser")}>
            <PackagePlus />
            Browse mods
          </Button>
        </div>
      </div>

      {activeModpack ? (
        <ServerPanel title="Active modpack">
          <div className="flex flex-wrap items-center gap-3">
            <PackageSearch className="text-primary" />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold">{activeModpack.name || activeModpack.projectId}</div>
              <div className="text-xs text-muted-foreground">
                {activeModpack.version || "Unknown version"} {activeModpack.mcVersion ? `for Minecraft ${activeModpack.mcVersion}` : ""}
              </div>
            </div>
            {activeModpack.loaders?.map((loader) => (
              <Badge key={loader} variant="muted">
                {loader}
              </Badge>
            ))}
          </div>
        </ServerPanel>
      ) : null}

      {activeDialog === "mod-browser" ? (
        <ModrinthBrowserPanel
          title="Browse Modrinth mods"
          description="Searches compatible projects using this server's Minecraft version and loader when available. Dependency and compatibility choice dialogs are still a follow-up surface."
          query={modSearch}
          results={(modSearchQuery.data as ModrinthSearchResult | undefined)?.hits ?? []}
          loading={modSearchQuery.isFetching}
          installingId={installModMutation.isPending || preflightId ? installingId : null}
          emptyText="No compatible mods found."
          installLabel="Install"
          onQueryChange={setModSearch}
          onInstall={(hit) => void startModInstall(hit)}
          getInstallState={(hit) =>
            isModInstalled(hit)
              ? {
                  disabled: true,
                  label: "Installed",
                  title: "This mod is already in your mods folder",
                }
              : {}
          }
          onClose={() => modsUiStoreActions.setActiveDialog(null)}
        />
      ) : null}

      {activeDialog === "modpack-browser" ? (
        <ModrinthBrowserPanel
          title="Browse Modrinth modpacks"
          description="Installs replace the active modpack with a backup by default and can continue through missing-file or server/client-side decisions when Modrinth metadata is incomplete."
          query={modpackSearch}
          results={(modpackSearchQuery.data as ModrinthSearchResult | undefined)?.hits ?? []}
          loading={modpackSearchQuery.isFetching}
          installingId={installModpackMutation.isPending ? installingId : null}
          emptyText="No compatible modpacks found."
          installLabel={activeModpack ? "Replace" : "Install"}
          onQueryChange={setModpackSearch}
          onInstall={(hit) => {
            const message = activeModpack
              ? `Replace the current modpack with ${hit.title}? Fabricator will request a backup before installing.`
              : `Install ${hit.title} on this server?`;
            if (!window.confirm(message)) return;
            void runModpackInstall(hit);
          }}
          onClose={() => modsUiStoreActions.setActiveDialog(null)}
        />
      ) : null}

      <CompatibilityDialog
        pending={pendingCompatibility}
        loading={installModMutation.isPending}
        onSelect={(mcVersion) => setPendingCompatibility((current) => (current ? { ...current, selectedMcVersion: mcVersion } : current))}
        onCancel={() => setPendingCompatibility(null)}
        onConfirm={() => {
          if (!pendingCompatibility) return;
          const { hit, selectedMcVersion } = pendingCompatibility;
          setPendingCompatibility(null);
          void prepareModInstall(hit, selectedMcVersion);
        }}
      />

      <DependencyDialog
        pending={pendingDependency}
        loading={installModMutation.isPending}
        onCancel={() => setPendingDependency(null)}
        onMainOnly={() => {
          if (!pendingDependency) return;
          const { hit, mcVersion } = pendingDependency;
          setPendingDependency(null);
          installModMutation.mutate({ hit, mcVersion });
        }}
        onWithDependencies={() => {
          if (!pendingDependency) return;
          const { hit, mcVersion, missing } = pendingDependency;
          setPendingDependency(null);
          installModMutation.mutate({ hit, mcVersion, dependencies: missing });
        }}
      />

      <MissingFilesDialog
        pending={pendingMissingFiles}
        loading={installModpackMutation.isPending}
        onCancel={() => setPendingMissingFiles(null)}
        onContinue={() => {
          if (!pendingMissingFiles) return;
          const { hit } = pendingMissingFiles;
          setPendingMissingFiles(null);
          void runModpackInstall(hit, { allowMissing: true });
        }}
      />

      <SideDecisionDialog
        pending={pendingSideDecisions}
        loading={installModpackMutation.isPending}
        onCancel={() => setPendingSideDecisions(null)}
        onSelect={(path, side) =>
          setPendingSideDecisions((current) =>
            current ? { ...current, selections: { ...current.selections, [path]: side } } : current,
          )
        }
        onContinue={() => {
          if (!pendingSideDecisions) return;
          const { hit, selections } = pendingSideDecisions;
          const sideOverrides = Object.fromEntries(
            Object.entries(selections).filter((entry): entry is [string, "server" | "client"] => entry[1] === "server" || entry[1] === "client"),
          );
          setPendingSideDecisions(null);
          void runModpackInstall(hit, { sideOverrides });
        }}
      />

      <InstalledModsPanel
        mods={filteredMods}
        loading={mods.isLoading}
        search={searchText}
        selectedFilenames={selectedFilenames}
        deleting={deleteOne.isPending || deleteSelected.isPending}
        onSearchChange={modsUiStoreActions.setSearchText}
        onToggle={modsUiStoreActions.toggleModSelection}
        onToggleAll={toggleAll}
        onClearSelection={modsUiStoreActions.clearSelection}
        onDeleteOne={removeOne}
        onDeleteSelected={removeSelected}
      />
    </div>
  );
}

function CompatibilityDialog({
  pending,
  loading,
  onSelect,
  onCancel,
  onConfirm,
}: {
  pending: PendingCompatibility | null;
  loading: boolean;
  onSelect: (mcVersion: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog
      open={Boolean(pending)}
      title="Compatibility Warning"
      description={pending ? `${pending.hit.title} is marked ${pending.status} for this server version.` : undefined}
      onOpenChange={(open) => {
        if (!open) onCancel();
      }}
    >
      {pending ? (
        <div className="space-y-4 px-4 py-4">
          <Alert>
            <AlertTriangle />
            <AlertTitle>Choose the Minecraft version to install against</AlertTitle>
            <AlertDescription>
              Fabricator will ask the backend to resolve the best project file for the selected Minecraft version and this server's loader.
            </AlertDescription>
          </Alert>
          <div className="grid gap-2">
            {pending.choices.map((choice) => (
              <Button
                key={choice.id}
                type="button"
                variant={pending.selectedMcVersion === choice.mcVersion ? "default" : "outline"}
                className="h-auto justify-start px-3 py-2 text-left"
                onClick={() => onSelect(choice.mcVersion)}
              >
                <span className="grid gap-1">
                  <span className="font-medium">{choice.label}</span>
                  <span className={pending.selectedMcVersion === choice.mcVersion ? "text-xs text-primary-foreground/75" : "text-xs text-muted-foreground"}>
                    Minecraft {choice.mcVersion}
                  </span>
                </span>
              </Button>
            ))}
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" disabled={loading} onClick={onCancel}>
              Cancel
            </Button>
            <Button type="button" size="sm" disabled={loading} onClick={onConfirm}>
              {loading ? "Installing..." : "Install selected version"}
            </Button>
          </div>
        </div>
      ) : null}
    </Dialog>
  );
}

function DependencyDialog({
  pending,
  loading,
  onCancel,
  onMainOnly,
  onWithDependencies,
}: {
  pending: PendingDependency | null;
  loading: boolean;
  onCancel: () => void;
  onMainOnly: () => void;
  onWithDependencies: () => void;
}) {
  return (
    <Dialog
      open={Boolean(pending)}
      title="Missing dependencies"
      description={pending ? `${pending.hit.title} requires additional projects that are not installed yet.` : undefined}
      onOpenChange={(open) => {
        if (!open) onCancel();
      }}
    >
      {pending ? (
        <div className="space-y-4 px-4 py-4">
          <div className="grid gap-2">
            {pending.missing.map((dependency) => (
              <div key={dependency.modId} className="rounded-md border border-border bg-card px-3 py-2">
                <div className="text-sm font-medium">{dependency.modTitle}</div>
                <div className="text-xs text-muted-foreground">{dependency.modId}</div>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" disabled={loading} onClick={onCancel}>
              Cancel
            </Button>
            <Button type="button" variant="outline" size="sm" disabled={loading} onClick={onMainOnly}>
              Install mod only
            </Button>
            <Button type="button" size="sm" disabled={loading} onClick={onWithDependencies}>
              {loading ? "Installing..." : "Install with dependencies"}
            </Button>
          </div>
        </div>
      ) : null}
    </Dialog>
  );
}

function MissingFilesDialog({
  pending,
  loading,
  onCancel,
  onContinue,
}: {
  pending: PendingMissingFiles | null;
  loading: boolean;
  onCancel: () => void;
  onContinue: () => void;
}) {
  return (
    <Dialog
      open={Boolean(pending)}
      title="Modpack files are unavailable"
      description={pending ? `${pending.hit.title} references files Modrinth could not provide.` : undefined}
      onOpenChange={(open) => {
        if (!open) onCancel();
      }}
    >
      {pending ? (
        <div className="space-y-4 px-4 py-4">
          <Alert>
            <AlertTriangle />
            <AlertTitle>Continue only if you expect these files to be optional</AlertTitle>
            <AlertDescription>The retry keeps the existing install path and skips backup creation, matching the Vue continuation flow.</AlertDescription>
          </Alert>
          <ContinuationFileList files={pending.files} />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" disabled={loading} onClick={onCancel}>
              Cancel
            </Button>
            <Button type="button" size="sm" disabled={loading} onClick={onContinue}>
              {loading ? "Continuing..." : "Continue without missing files"}
            </Button>
          </div>
        </div>
      ) : null}
    </Dialog>
  );
}

function SideDecisionDialog({
  pending,
  loading,
  onCancel,
  onSelect,
  onContinue,
}: {
  pending: PendingSideDecisions | null;
  loading: boolean;
  onCancel: () => void;
  onSelect: (path: string, side: "server" | "client") => void;
  onContinue: () => void;
}) {
  const complete = pending ? Object.values(pending.selections).every(Boolean) : false;
  return (
    <Dialog
      open={Boolean(pending)}
      title="Choose mod sides"
      description={pending ? `${pending.hit.title} has files whose server/client side could not be determined automatically.` : undefined}
      className="max-w-lg"
      onOpenChange={(open) => {
        if (!open) onCancel();
      }}
    >
      {pending ? (
        <div className="space-y-4 px-4 py-4">
          <div className="grid gap-2">
            {pending.files.map((file) => (
              <div key={file.path} className="rounded-md border border-border bg-card p-3">
                <div className="text-sm font-medium">{file.path}</div>
                {file.reason ? <div className="mt-1 text-xs text-muted-foreground">{file.reason}</div> : null}
                <div className="mt-3 flex gap-2">
                  {(["server", "client"] as const).map((side) => (
                    <Button
                      key={side}
                      type="button"
                      variant={pending.selections[file.path] === side ? "default" : "outline"}
                      size="sm"
                      onClick={() => onSelect(file.path, side)}
                    >
                      {side === "server" ? "Server" : "Client"}
                    </Button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" disabled={loading} onClick={onCancel}>
              Cancel
            </Button>
            <Button type="button" size="sm" disabled={loading || !complete} onClick={onContinue}>
              {loading ? "Continuing..." : "Apply decisions"}
            </Button>
          </div>
        </div>
      ) : null}
    </Dialog>
  );
}

function ContinuationFileList({ files }: { files: ContinuationFile[] }) {
  return (
    <div className="grid max-h-60 gap-2 overflow-y-auto">
      {files.map((file) => (
        <div key={file.path} className="rounded-md border border-border bg-card px-3 py-2">
          <div className="break-all text-sm font-medium">{file.path}</div>
          {file.reason ? <div className="mt-1 text-xs text-muted-foreground">{file.reason}</div> : null}
        </div>
      ))}
    </div>
  );
}
