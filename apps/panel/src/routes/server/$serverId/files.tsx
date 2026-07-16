import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useStore } from "@tanstack/react-store";
import { useParams } from "@tanstack/react-router";
import { ChevronUp, Copy, File, Folder, RefreshCcw } from "lucide-react";
import { toast } from "sonner";

import * as serversApi from "@/api/servers";
import { ServerPanel } from "@/components/server/server-panel";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { formatFileSize, formatTimestamp } from "@/lib/format";
import { copyText, isTextFile, parentPath, pathBreadcrumbs } from "@/lib/files";
import { queryKeys } from "@/lib/query-keys";
import { cn } from "@/lib/utils";
import { serverFilesQuery } from "@/queries/servers";
import {
  closeEditor,
  fileEditorStore,
  fileEditorStoreActions,
  markEditorSaved,
  openEditor,
  updateEditorContent,
} from "@/stores/file-editor-store";

export function FilesPage() {
  const { serverId } = useParams({ from: "/app/server/$serverId" });
  const queryClient = useQueryClient();
  const [currentPath, setCurrentPath] = useState("");
  const [openingPath, setOpeningPath] = useState<string | null>(null);
  const discardResolver = useRef<((discard: boolean) => void) | null>(null);
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

  useEffect(() => () => {
    if (discardResolver.current) {
      discardResolver.current(false);
      discardResolver.current = null;
    }
  }, []);

  function confirmDiscard() {
    if (!hasFileChanges) return true;
    fileEditorStoreActions.setDiscardPromptOpen(true);
    return new Promise<boolean>((resolve) => {
      discardResolver.current = resolve;
    });
  }

  function resolveDiscard(discard: boolean) {
    fileEditorStoreActions.setDiscardPromptOpen(false);
    if (discardResolver.current) {
      discardResolver.current(discard);
      discardResolver.current = null;
    }
  }

  async function copyPath() {
    const path = files.data?.absolutePath;
    if (!path) return;
    if (await copyText(path)) {
      toast.success("Path copied");
    } else {
      toast.error("Could not copy path");
    }
  }

  async function openFile(path: string) {
    if (!isTextFile(path)) {
      toast.error("Only supported text files can be edited");
      return;
    }
    if (!(await confirmDiscard())) return;
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

  async function browse(path: string) {
    if (!(await confirmDiscard())) return;
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
        <Button variant="ghost" size="sm" disabled={!canGoUp} onClick={() => void browse(parentPath(files.data?.currentPath ?? currentPath))}>
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
                onClick={() => void browse(crumb.path)}
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
                          onClick={() => entry.isDir ? void browse(path) : void openFile(path)}
                          onDoubleClick={() => { if (entry.isDir) void browse(path); }}
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
              <Button variant="ghost" size="sm" disabled={saveFile.isPending} onClick={async () => { if (await confirmDiscard()) closeEditor(); }}>Close</Button>
              <Button size="sm" disabled={!hasFileChanges || saveFile.isPending} onClick={() => saveFile.mutate()}>
                Save
              </Button>
            </div>
          }
        >
          <Textarea
            className="min-h-80 resize-y bg-secondary font-mono"
            value={editor.content}
            disabled={saveFile.isPending}
            spellCheck={false}
            onChange={(event) => updateEditorContent(event.target.value)}
          />
          {saveFile.isError ? (
            <p className="mt-2 text-sm text-destructive">{saveFile.error instanceof Error ? saveFile.error.message : "Failed to save file"}</p>
          ) : null}
        </ServerPanel>
      ) : null}
      <ConfirmDialog
        open={editor.discardPromptOpen}
        title="Discard unsaved changes?"
        message="You have unsaved changes."
        description="Continuing will discard your edits. This cannot be undone."
        confirmText="Discard changes"
        cancelText="Keep editing"
        onCancel={() => resolveDiscard(false)}
        onConfirm={() => resolveDiscard(true)}
      />
    </div>
  );
}
