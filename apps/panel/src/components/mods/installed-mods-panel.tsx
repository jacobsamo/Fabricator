import type { InstalledMod } from "@/api/schemas";
import { ServerPanel } from "@/components/server/server-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatFileSize } from "@/lib/format";
import { installedModDisplayName, installedModFilename, installedModInitial } from "@/lib/mods";
import { cn } from "@/lib/utils";

type InstalledModsPanelProps = {
  mods: InstalledMod[];
  loading?: boolean;
  search: string;
  selectedFilenames: string[];
  deleting?: boolean;
  onSearchChange: (value: string) => void;
  onToggle: (filename: string) => void;
  onToggleAll: () => void;
  onClearSelection: () => void;
  onDeleteOne: (mod: InstalledMod) => void;
  onDeleteSelected: () => void;
};

export function InstalledModsPanel({
  mods,
  loading = false,
  search,
  selectedFilenames,
  deleting = false,
  onSearchChange,
  onToggle,
  onToggleAll,
  onClearSelection,
  onDeleteOne,
  onDeleteSelected,
}: InstalledModsPanelProps) {
  const selected = new Set(selectedFilenames);
  const allSelected = mods.length > 0 && mods.every((mod) => selected.has(installedModFilename(mod)));

  return (
    <ServerPanel title="Installed mods" padded={false}>
      <div className="border-b border-border p-4">
        <Input placeholder="Search installed mods..." value={search} onChange={(event) => onSearchChange(event.target.value)} />
      </div>
      {selectedFilenames.length > 0 ? (
        <div className="flex items-center justify-between gap-3 border-b border-primary/20 bg-primary/10 px-4 py-2">
          <label className="flex items-center gap-2 text-sm text-secondary-foreground">
            <input checked={allSelected} className="size-[15px] accent-primary" type="checkbox" onChange={onToggleAll} />
            {allSelected ? "Deselect all" : `${selectedFilenames.length} selected`}
          </label>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={onClearSelection}>
              Clear
            </Button>
            <Button disabled={deleting} size="sm" variant="destructive" onClick={onDeleteSelected}>
              Delete {selectedFilenames.length} mod{selectedFilenames.length === 1 ? "" : "s"}
            </Button>
          </div>
        </div>
      ) : null}
      {loading ? (
        <div className="p-5 text-center text-sm text-muted-foreground">Loading mods...</div>
      ) : mods.length === 0 ? (
        <div className="p-5 text-center text-sm text-muted-foreground">
          {search.trim() ? `No mods match "${search.trim()}".` : 'No mods installed yet. Use "Browse mods" to add one.'}
        </div>
      ) : (
        <ul>
          {mods.map((mod) => {
            const filename = installedModFilename(mod);
            const isSelected = selected.has(filename);
            return (
              <li
                className={cn("flex items-center gap-3 border-b border-border p-3 last:border-b-0", isSelected && "bg-primary/5")}
                key={filename}
              >
                <label className="flex shrink-0 items-center" aria-label={`Select ${installedModDisplayName(mod)}`}>
                  <input checked={isSelected} className="size-[15px] accent-primary" type="checkbox" onChange={() => onToggle(filename)} />
                </label>
                <div className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-sm border border-border bg-muted">
                  {"iconUrl" in mod && typeof mod.iconUrl === "string" ? (
                    <img alt="" className="size-full object-cover" src={mod.iconUrl} />
                  ) : (
                    <span className="font-mono text-sm font-bold text-muted-foreground">{installedModInitial(mod)}</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex min-w-0 items-baseline gap-2">
                    <span className="truncate text-sm font-semibold">{installedModDisplayName(mod)}</span>
                    {"version" in mod && typeof mod.version === "string" ? (
                      <span className="shrink-0 rounded-full border border-border bg-muted px-2 py-0.5 text-xs text-muted-foreground">{mod.version}</span>
                    ) : null}
                  </div>
                  <div className="text-xs text-muted-foreground">{mod.size ? formatFileSize(mod.size) : "-"}</div>
                </div>
                <Button disabled={deleting} size="sm" variant="outline" onClick={() => onDeleteOne(mod)}>
                  Remove
                </Button>
              </li>
            );
          })}
        </ul>
      )}
      {!loading && mods.length > 1 && selectedFilenames.length === 0 ? (
        <div className="border-t border-border p-2 text-center">
          <Button size="sm" variant="ghost" onClick={onToggleAll}>
            Select all {mods.length} mods
          </Button>
        </div>
      ) : null}
    </ServerPanel>
  );
}
