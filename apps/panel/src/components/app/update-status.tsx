import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import * as serversApi from "@/api/servers";
import { ConfirmDialog } from "@/components/ui/dialog";
import { queryKeys } from "@/lib/query-keys";
import { updateStatusQuery } from "@/queries/update";

type UpdateStatusProps = {
  compact?: boolean;
};

export function UpdateStatus({ compact = false }: UpdateStatusProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const queryClient = useQueryClient();
  const update = useQuery(updateStatusQuery);
  const outcomeWatch = useRef<0 | 1 | 2>(0);
  const status = update.data;

  const trigger = useMutation({
    mutationFn: () => serversApi.triggerUpdate(),
    onSuccess: async (result) => {
      if (result.started) {
        outcomeWatch.current = 1;
        toast.success("Update started in background", { description: "Fabricator Update" });
        await queryClient.invalidateQueries({ queryKey: queryKeys.session.update.status });
      } else {
        toast.error(result.error || "Unable to start update", { description: "Fabricator Update" });
      }
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to trigger update", { description: "Fabricator Update" });
    },
  });

  useEffect(() => {
    if (!status) return;
    if (outcomeWatch.current === 1 && status.inProgress) {
      outcomeWatch.current = 2;
    }
    if (outcomeWatch.current === 2 && !status.inProgress) {
      outcomeWatch.current = 0;
      if (status.lastExitCode === 0) {
        toast.success("Update finished. Refresh the page if it does not reload automatically.", { description: "Fabricator Update" });
      } else {
        const detail = status.lastError || (status.lastExitCode != null ? `Exit code ${status.lastExitCode}` : "Update failed");
        toast.error(detail, { description: "Fabricator Update" });
      }
    }
  }, [status]);

  const updateAvailable = Boolean(status?.updateAvailable) && !status?.inProgress && !status?.selfUpdateDisabled;
  const label = status?.selfUpdateDisabled
    ? "Managed by image"
    : status?.inProgress || trigger.isPending
      ? "Updating..."
      : updateAvailable
        ? "Update available"
        : "Up to date";
  const version = status?.currentVersion || "";

  return (
    <>
      <button
        type="button"
        className="flex w-full items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-left text-xs text-muted-foreground transition enabled:hover:border-primary/60 enabled:hover:text-foreground disabled:cursor-default"
        disabled={!updateAvailable || trigger.isPending}
        onClick={() => setConfirmOpen(true)}
      >
        <span className={updateAvailable ? "size-1.5 rounded-full bg-primary" : "size-1.5 rounded-full bg-muted-foreground"} aria-hidden="true" />
        <span className="min-w-0 flex-1 truncate">{label}</span>
        {!compact && version ? <span className="max-w-16 truncate text-muted-foreground/75">{version}</span> : null}
      </button>
      <ConfirmDialog
        open={confirmOpen}
        title="Run Fabricator update?"
        message="Run Fabricator update now?"
        description="The service may restart briefly while preserving server data and config."
        confirmText="Run update"
        loading={trigger.isPending}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false);
          trigger.mutate();
        }}
      />
    </>
  );
}
