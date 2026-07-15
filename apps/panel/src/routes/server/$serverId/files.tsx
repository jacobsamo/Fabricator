import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useStore } from "@tanstack/react-store";
import { useParams } from "@tanstack/react-router";
import { ChevronUp, Copy, File, Folder, RefreshCcw } from "lucide-react";
import { toast } from "sonner";

import * as serversApi from "@/api/servers";
import { ServerPanel } from "@/components/server/server-panel";
import { Button } from "@/components/ui/button";
import { formatFileSize, formatTimestamp } from "@/lib/format";
import { isTextFile, parentPath, pathBreadcrumbs } from "@/lib/files";
import { queryKeys } from "@/lib/query-keys";
import { cn } from "@/lib/utils";
import { serverFilesQuery } from "@/queries/servers";
import {
  closeEditor,
  fileEditorStore,
  markEditorSaved,
  openEditor,
  updateEditorContent,
} from "@/stores/file-editor-store";

export function FilesPage() {
  const { serverId } = useParams({ from: "/app/server/$serverId" });
  const queryClient = useQueryClient();
  const [currentPath, setCurrentPath] = useState("");
  const [openingPath, setOpeningPath] = useState<string | null>(null);
  const editor = useStore(fileEditorStore, (state) => state);
  const hasFileChanges = Boolean(editor.path && editor.content !== editor.originalContent);

  const files = useQuery(serverFilesQuery(serverId, currentPath));

  const saveFile = useMutation({
    mutationFn: () => {
      if (!editor.path) throw new Error("No file is open");
      return serversApi.saveServerFile(serverId, editor.path, editor.content);
    },
    onSuccess: () => {
      markEditorSaved(fileEditorStore.state.content);
      toast.success("File saved");
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Failed to save file"),
  });

  useEffect(() => {
    closeEditor();
    setCurrentPath("");
  }, [serverId]);

  function confirmDiscard() {
    if (!hasFileChanges) return true;
    return window.confirm("Discard unsaved changes? Continuing will discard your edits.");
  }

  async function copyPath() {
    const path = files.data?.absolutePath;
    if (!path) return;
    try {
      await navigator.clipboard.writeText(path);
      toast.success("Path copied");
    } catch {
      toast.error("Could not copy path");
    }
  }

  async function openFile(path: string) {
    if (!isTextFile(path)) {
      toast.error("Only supported text files can be edited");
      return;
    }
    if (!confirmDiscard()) return;
    setOpeningPath(path);
    try {
      const file = await queryClient.fetchQuery({
        queryKey: queryKeys.session.serverFile(serverId, path),
        queryFn: () => serversApi.getServerFile(serverId, path),
      });
      openEditor(file.path || path, file.content || "");
      toast.success("File opened");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to open file");
    } finally {
      setOpeningPath(null);
    }
  }

  function browse(path: string) {
    if (!confirmDiscard()) return;
    setCurrentPath(path);
  }

  const breadcrumbs = pathBreadcrumbs(files.data?.currentPath ?? currentPath);
  const canGoUp = Boolean(files.data?.currentPath ?? currentPath);

  return (
    <div className="flex flex-col gap-3">
      {files.data?.absolutePath ? (
        <div className="flex items-center gap-2 rounded-md border border-border bg-secondary px-3 py-2 text-xs text-muted-foreground">
          <Folder className="text-muted-foreground" />
          <code className="min-w-0 flex-1 truncate text-secondary-foreground">{files.data.absolutePath}</code>
          <Button variant="ghost" size="sm" onClick={() => void copyPath()}>
            <Copy />
            Copy
          </Button>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="sm" disabled={!canGoUp} onClick={() => browse(parentPath(files.data?.currentPath ?? currentPath))}>
          <ChevronUp />
          Up
        </Button>
        <nav className="flex min-w-0 flex-1 items-center gap-1 overflow-hidden whitespace-nowrap text-sm" aria-label="Path">
          {breadcrumbs.map((crumb, index) => (
            <span key={crumb.path || "root"} className="flex min-w-0 items-center gap-1">
              <button
                type="button"
                className={cn("truncate rounded px-1 py-0.5 text-muted-foreground hover:bg-accent hover:text-foreground", index === breadcrumbs.length - 1 && "text-foreground")}
                disabled={index === breadcrumbs.length - 1}
                onClick={() => browse(crumb.path)}
              >
                {crumb.label}
              </button>
              {index < breadcrumbs.length - 1 ? <span className="text-muted-foreground/50">/</span> : null}
            </span>
          ))}
        </nav>
        <Button variant="ghost" size="sm" disabled={files.isFetching} onClick={() => void files.refetch()}>
          <RefreshCcw />
          Refresh
        </Button>
      </div>

      <ServerPanel padded={false}>
        {files.isLoading ? (
          <div className="p-6 text-center text-sm text-muted-foreground">Loading...</div>
        ) : files.isError ? (
          <div className="p-6 text-center text-sm text-destructive">{files.error instanceof Error ? files.error.message : "Unable to load files"}</div>
        ) : !files.data?.entries.length ? (
          <div className="p-6 text-center text-sm text-muted-foreground">This folder is empty.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-normal text-muted-foreground">
                  <th className="px-4 py-3 font-semibold">Name</th>
                  <th className="w-36 px-4 py-3 font-semibold">Size</th>
                  <th className="w-48 px-4 py-3 font-semibold">Modified</th>
                </tr>
              </thead>
              <tbody>
                {files.data.entries.map((entry) => {
                  const path = entry.relativePath || entry.name;
                  return (
                    <tr key={path} className="border-b border-border last:border-b-0 hover:bg-accent/60">
                      <td className="px-4 py-2">
                        <button
                          type="button"
                          className="flex min-w-0 items-center gap-2 text-left text-sm text-secondary-foreground"
                          onClick={() => entry.isDir ? browse(path) : void openFile(path)}
                          onDoubleClick={() => { if (entry.isDir) browse(path); }}
                        >
                          {entry.isDir ? <Folder className="text-primary" /> : <File className="text-muted-foreground" />}
                          <span className="truncate">{entry.name}</span>
                          {!entry.isDir && !isTextFile(path) ? <span className="text-xs text-muted-foreground">read-only</span> : null}
                          {openingPath === path ? <span className="text-xs text-primary">opening...</span> : null}
                        </button>
                      </td>
                      <td className="px-4 py-2 text-xs text-muted-foreground">{formatFileSize(entry.size)}</td>
                      <td className="px-4 py-2 text-xs text-muted-foreground">{formatTimestamp(entry.updatedAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </ServerPanel>

      {editor.path ? (
        <ServerPanel
          title={editor.path}
          action={
            <div className="flex items-center gap-2">
              {hasFileChanges ? <span className="text-xs text-warning">Unsaved changes</span> : null}
              <Button variant="ghost" size="sm" disabled={saveFile.isPending} onClick={() => { if (confirmDiscard()) closeEditor(); }}>Close</Button>
              <Button size="sm" disabled={!hasFileChanges || saveFile.isPending} onClick={() => saveFile.mutate()}>
                Save
              </Button>
            </div>
          }
        >
          <textarea
            className="min-h-80 w-full resize-y rounded-md border border-border bg-secondary p-3 font-mono text-sm text-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/35 disabled:opacity-60"
            value={editor.content}
            disabled={saveFile.isPending}
            spellCheck={false}
            onChange={(event) => updateEditorContent(event.target.value)}
          />
        </ServerPanel>
      ) : null}
    </div>
  );
}
