import * as React from "react";
import { Download, PackageSearch, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ServerPanel } from "@/components/server/server-panel";
import type { ModrinthSearchHit } from "@/lib/modrinth";

type ModrinthBrowserPanelProps = {
  title: string;
  description: string;
  query: string;
  results: ModrinthSearchHit[];
  loading?: boolean;
  installingId?: string | null;
  emptyText: string;
  installLabel: string;
  onQueryChange: (query: string) => void;
  onInstall: (hit: ModrinthSearchHit) => void;
  onClose: () => void;
};

export function ModrinthBrowserPanel({
  title,
  description,
  query,
  results,
  loading = false,
  installingId = null,
  emptyText,
  installLabel,
  onQueryChange,
  onInstall,
  onClose,
}: ModrinthBrowserPanelProps) {
  return (
    <ServerPanel
      title={title}
      action={
        <Button size="sm" variant="ghost" onClick={onClose}>
          Close
        </Button>
      }
    >
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">{description}</p>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search Modrinth..." value={query} onChange={(event) => onQueryChange(event.target.value)} />
        </div>
        {loading ? <div className="rounded-md border border-border bg-muted/40 p-4 text-sm text-muted-foreground">Searching...</div> : null}
        {!loading && results.length === 0 ? (
          <div className="rounded-md border border-border bg-muted/40 p-4 text-sm text-muted-foreground">{emptyText}</div>
        ) : null}
        <div className="grid gap-2">
          {results.map((hit) => {
            const id = hit.project_id || hit.slug || hit.title;
            return (
              <article className="flex gap-3 rounded-md border border-border bg-card p-3" key={id}>
                <div className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-sm border border-border bg-muted">
                  {hit.icon_url ? <img alt="" className="size-full object-cover" src={hit.icon_url} /> : <PackageSearch className="text-muted-foreground" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="truncate text-sm font-semibold">{hit.title}</h3>
                    {hit.author ? <Badge variant="muted">{hit.author}</Badge> : null}
                  </div>
                  <p className="line-clamp-2 text-sm text-muted-foreground">{hit.description || "No description provided."}</p>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                    {typeof hit.downloads === "number" ? <span>{hit.downloads.toLocaleString()} downloads</span> : null}
                    {hit.latest_version ? <span>latest {hit.latest_version}</span> : null}
                  </div>
                </div>
                <Button disabled={installingId === id} size="sm" onClick={() => onInstall(hit)}>
                  <Download />
                  {installingId === id ? "Installing" : installLabel}
                </Button>
              </article>
            );
          })}
        </div>
      </div>
    </ServerPanel>
  );
}
