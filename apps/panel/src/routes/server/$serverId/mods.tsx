import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import { Boxes, PackagePlus, PackageSearch } from "lucide-react";
import { toast } from "sonner";

import type { InstalledMod } from "@/api/schemas";
import { InstalledModsPanel } from "@/components/mods/installed-mods-panel";
import { ModrinthBrowserPanel } from "@/components/modrinth/modrinth-browser-panel";
import { ServerPanel } from "@/components/server/server-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
    mutationFn: (hit: ModrinthSearchHit) =>
      installMod(hitId(hit), {
        mc_version: serverData?.version,
        loader: serverData?.loader,
        server_id: serverId,
      }),
    onError: (error) => toast.error(error instanceof Error ? error.message : "Failed to install mod"),
    onSuccess: (_result, hit) => {
      toast.success(`${hit.title} installed`);
      void queryClient.invalidateQueries({ queryKey: queryKeys.session.serverMods(serverId) });
    },
  });

  const installModpackMutation = useMutation({
    mutationFn: (hit: ModrinthSearchHit) =>
      installModpack(hitId(hit), {
        mc_version: serverData?.version,
        loader: serverData?.loader,
        server_id: serverId,
        clean_install: Boolean(serverData?.modpack),
        create_backup: true,
      }),
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to install modpack");
    },
    onSuccess: (_result, hit) => {
      toast.success(`${hit.title} modpack install started`);
      void queryClient.invalidateQueries({ queryKey: queryKeys.session.server(serverId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.session.serverMods(serverId) });
    },
  });

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
  const installingId = installModMutation.variables ? hitId(installModMutation.variables) : installModpackMutation.variables ? hitId(installModpackMutation.variables) : null;

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
          installingId={installModMutation.isPending ? installingId : null}
          emptyText="No compatible mods found."
          installLabel="Install"
          onQueryChange={setModSearch}
          onInstall={(hit) => installModMutation.mutate(hit)}
          onClose={() => modsUiStoreActions.setActiveDialog(null)}
        />
      ) : null}

      {activeDialog === "modpack-browser" ? (
        <ModrinthBrowserPanel
          title="Browse Modrinth modpacks"
          description="Installs replace the active modpack with a backup by default. Missing-file and server/client-side continuation dialogs are represented as follow-up blockers in this first React pass."
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
            installModpackMutation.mutate(hit);
          }}
          onClose={() => modsUiStoreActions.setActiveDialog(null)}
        />
      ) : null}

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
