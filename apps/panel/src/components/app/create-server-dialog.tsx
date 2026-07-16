import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useForm } from "@tanstack/react-form";
import { AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";

import * as serversApi from "@/api/servers";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createServerFormSchema, type CreateServerFormValues } from "@/forms/schemas";
import { queryClient } from "@/lib/query-client";
import { queryKeys } from "@/lib/query-keys";
import { javaStatusQuery, loaderGameVersionsQuery } from "@/queries/java";
import { serverInstallProgressQuery, useCreateServerMutation } from "@/queries/servers";
import { appStoreActions, useAppStore } from "@/stores/app-store";

const loaderOptions = [
  { value: "fabric", label: "Fabric" },
  { value: "vanilla", label: "Vanilla" },
  { value: "forge", label: "Forge" },
  { value: "neoforge", label: "NeoForge" },
  { value: "quilt", label: "Quilt" },
];

const defaultValues: CreateServerFormValues = {
  name: "",
  loader: "fabric",
  version: "",
  port: 25565,
  installPath: "",
  memory: 4,
  maxPlayers: 20,
  difficulty: "normal",
  gamemode: "survival",
  eulaAccepted: false,
};

type InstallState = "idle" | "installing" | "failed";

function versionValue(version: unknown) {
  if (typeof version === "string") return version;
  if (version && typeof version === "object" && "version" in version) {
    const value = (version as { version?: unknown }).version;
    return typeof value === "string" ? value : "";
  }
  return "";
}

function progressPhase(progress: unknown) {
  if (!progress || typeof progress !== "object") return "Preparing...";
  const phase = (progress as { phase?: unknown; step?: unknown; status?: unknown }).phase
    ?? (progress as { step?: unknown }).step
    ?? (progress as { status?: unknown }).status;
  if (typeof phase !== "string") return "Working...";
  return phase.replace(/_/g, " ").replace(/^./, (char) => char.toUpperCase());
}

function progressPercent(progress: unknown) {
  if (!progress || typeof progress !== "object") return null;
  const record = progress as { bytes_done?: unknown; bytes_total?: unknown; progress?: unknown };
  if (typeof record.bytes_done === "number" && typeof record.bytes_total === "number" && record.bytes_total > 0) {
    return Math.min(100, Math.round((record.bytes_done / record.bytes_total) * 100));
  }
  if (typeof record.progress === "number") {
    return Math.max(0, Math.min(100, Math.round(record.progress)));
  }
  return null;
}

function progressFailed(progress: unknown) {
  if (!progress || typeof progress !== "object") return false;
  const phase = String((progress as { phase?: unknown; status?: unknown }).phase ?? (progress as { status?: unknown }).status ?? "");
  return phase.toLowerCase() === "failed" || phase.toLowerCase() === "error";
}

function progressComplete(progress: unknown) {
  if (!progress || typeof progress !== "object") return false;
  const phase = String((progress as { phase?: unknown; status?: unknown }).phase ?? (progress as { status?: unknown }).status ?? "");
  return ["complete", "completed", "done", "success"].includes(phase.toLowerCase());
}

function progressError(progress: unknown) {
  if (!progress || typeof progress !== "object") return null;
  const error = (progress as { error?: unknown; message?: unknown }).error ?? (progress as { message?: unknown }).message;
  return typeof error === "string" ? error : null;
}

export function CreateServerDialog() {
  const open = useAppStore((state) => state.globalModal === "create-server");
  const navigate = useNavigate();
  const [loader, setLoader] = useState(defaultValues.loader);
  const [version, setVersion] = useState(defaultValues.version);
  const [createdServerId, setCreatedServerId] = useState<string | null>(null);
  const [installState, setInstallState] = useState<InstallState>("idle");
  const [formError, setFormError] = useState("");

  const versions = useQuery(loaderGameVersionsQuery(loader));
  const java = useQuery({
    ...javaStatusQuery({ mcVersion: version }),
    enabled: Boolean(version),
  });
  const progress = useQuery({
    ...serverInstallProgressQuery(createdServerId || "__none__"),
    enabled: Boolean(createdServerId && installState === "installing"),
  });
  const create = useCreateServerMutation();
  const install = useMutation({
    mutationFn: (serverId: string) => serversApi.installServer(serverId),
    onSuccess: (_result, serverId) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.session.server(serverId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.session.servers });
      void queryClient.invalidateQueries({ queryKey: queryKeys.session.serverAction(serverId) });
    },
  });

  const form = useForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      setFormError("");
      const parsed = createServerFormSchema.safeParse(value);
      if (!parsed.success) {
        setFormError(parsed.error.issues[0]?.message || "Check the server details.");
        return;
      }

      const { eulaAccepted: _eulaAccepted, installPath, ...payload } = parsed.data;
      try {
        const server = await create.mutateAsync({
          ...payload,
          ...(installPath.trim() ? { installPath: installPath.trim() } : {}),
        });
        setCreatedServerId(server.id);
        setInstallState("installing");
        await install.mutateAsync(server.id);
        toast.success("Server install started", { description: server.name });
        await queryClient.invalidateQueries({ queryKey: queryKeys.session.servers });
        await navigate({ to: "/server/$serverId/overview", params: { serverId: server.id } });
      } catch (error) {
        setInstallState("failed");
        setFormError(error instanceof Error ? error.message : "Could not create the server.");
      }
    },
  });

  const availableVersions = useMemo(() => (versions.data ?? []).map(versionValue).filter(Boolean), [versions.data]);
  const percent = progressPercent(progress.data);
  const installFailed = installState === "failed" || progressFailed(progress.data);
  const installComplete = progressComplete(progress.data);
  const javaWarning = typeof (java.data as { warning?: unknown } | undefined)?.warning === "string"
    ? String((java.data as { warning?: unknown }).warning)
    : typeof (java.data as { message?: unknown } | undefined)?.message === "string"
      ? String((java.data as { message?: unknown }).message)
      : "";

  function closeDialog() {
    appStoreActions.setGlobalModal(null);
    if (installState !== "installing") {
      form.reset();
      setCreatedServerId(null);
      setInstallState("idle");
      setFormError("");
    }
  }

  function retryInstall() {
    if (!createdServerId) {
      setInstallState("idle");
      return;
    }
    setInstallState("installing");
    install.mutate(createdServerId);
  }

  return (
    <Dialog
      open={open}
      title="Create New Server"
      description="Create the server record, accept the Minecraft EULA, then start installation."
      className="max-h-[86vh] max-w-3xl overflow-hidden"
      onOpenChange={(nextOpen) => {
        if (!nextOpen) closeDialog();
      }}
    >
      {installState === "installing" ? (
        <div className="space-y-4 px-4 py-4">
          <div>
            <h3 className="text-base font-semibold">Installing server...</h3>
            <p className="mt-1 text-sm text-muted-foreground">{progressPhase(progress.data)}</p>
          </div>
          {percent == null ? (
            <div className="flex items-center gap-2 rounded-md border border-border bg-secondary p-3 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Installation is running. Forge and NeoForge installers can take several minutes.
            </div>
          ) : (
            <div>
              <div className="mb-2 flex justify-between text-xs text-muted-foreground">
                <span>Progress</span>
                <span>{percent}%</span>
              </div>
              <Progress value={percent} />
            </div>
          )}
          {installFailed ? <p className="text-sm text-destructive">{progressError(progress.data) || formError || "Installation failed."}</p> : null}
          {installComplete ? <p className="text-sm text-success">Installation completed.</p> : null}
          <div className="flex justify-end gap-2">
            {installFailed ? <Button type="button" onClick={retryInstall}>Retry</Button> : null}
            <Button type="button" variant="ghost" onClick={closeDialog}>Close (continues in background)</Button>
          </div>
        </div>
      ) : installState === "failed" ? (
        <div className="space-y-4 px-4 py-4">
          <Alert variant="destructive">
            <AlertDescription>{formError || "Installation failed."}</AlertDescription>
          </Alert>
          <div className="flex justify-end gap-2">
            <Button type="button" onClick={retryInstall} disabled={!createdServerId}>Retry</Button>
            <Button type="button" variant="ghost" onClick={closeDialog}>Close</Button>
          </div>
        </div>
      ) : (
        <form
          className="max-h-[calc(86vh-88px)] space-y-4 overflow-y-auto px-4 py-4"
          onSubmit={(event) => {
            event.preventDefault();
            void form.handleSubmit();
          }}
        >
          <section className="grid gap-3 rounded-md border border-border bg-card p-4 md:grid-cols-2">
            <form.Field name="name">
              {(field) => (
                <label className="grid gap-1 text-xs font-semibold uppercase text-muted-foreground">
                  Server name
                  <Input value={field.state.value} onChange={(event) => field.handleChange(event.target.value)} placeholder="My Minecraft Server" />
                </label>
              )}
            </form.Field>
            <form.Field name="loader">
              {(field) => (
                <label className="grid gap-1 text-xs font-semibold uppercase text-muted-foreground">
                  Mod loader
                  <Select
                    value={field.state.value}
                    onValueChange={(value) => {
                      if (!value) return;
                      field.handleChange(value);
                      setLoader(value);
                      setVersion("");
                      form.setFieldValue("version", "");
                    }}
                  >
                    <SelectTrigger className="h-10 w-full rounded-md">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {loaderOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </label>
              )}
            </form.Field>
            <form.Field name="version">
              {(field) => (
                <label className="grid gap-1 text-xs font-semibold uppercase text-muted-foreground">
                  Minecraft version
                  <Select
                    value={field.state.value}
                    disabled={versions.isLoading || availableVersions.length === 0}
                    onValueChange={(value) => {
                      if (!value) return;
                      field.handleChange(value);
                      setVersion(value);
                    }}
                  >
                    <SelectTrigger className="h-10 w-full rounded-md">
                      <SelectValue placeholder={versions.isLoading ? "Loading versions..." : "Choose a version"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {availableVersions.map((version) => <SelectItem key={version} value={version}>{version}</SelectItem>)}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </label>
              )}
            </form.Field>
            <form.Field name="port">
              {(field) => (
                <label className="grid gap-1 text-xs font-semibold uppercase text-muted-foreground">
                  Server port
                  <Input type="number" min={1024} max={65535} value={String(field.state.value)} onChange={(event) => field.handleChange(Number(event.target.value))} />
                </label>
              )}
            </form.Field>
            <form.Field name="installPath">
              {(field) => (
                <label className="grid gap-1 text-xs font-semibold uppercase text-muted-foreground md:col-span-2">
                  Installation path
                  <Input value={field.state.value} onChange={(event) => field.handleChange(event.target.value)} placeholder="Leave empty for auto-generated path" />
                </label>
              )}
            </form.Field>
          </section>

          {javaWarning ? (
            <Alert>
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              <AlertDescription>{javaWarning}</AlertDescription>
            </Alert>
          ) : null}

          <section className="grid gap-3 rounded-md border border-border bg-card p-4 md:grid-cols-2">
            <form.Field name="memory">
              {(field) => (
                <label className="grid gap-1 text-xs font-semibold uppercase text-muted-foreground">
                  Memory (GB)
                  <Input type="number" min={1} max={64} value={String(field.state.value)} onChange={(event) => field.handleChange(Number(event.target.value))} />
                </label>
              )}
            </form.Field>
            <form.Field name="maxPlayers">
              {(field) => (
                <label className="grid gap-1 text-xs font-semibold uppercase text-muted-foreground">
                  Max players
                  <Input type="number" min={1} max={1000} value={String(field.state.value)} onChange={(event) => field.handleChange(Number(event.target.value))} />
                </label>
              )}
            </form.Field>
            <form.Field name="difficulty">
              {(field) => (
                <label className="grid gap-1 text-xs font-semibold uppercase text-muted-foreground">
                  Difficulty
                  <Select value={field.state.value} onValueChange={(value) => { if (value) field.handleChange(value); }}>
                    <SelectTrigger className="h-10 w-full rounded-md"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectGroup>{["peaceful", "easy", "normal", "hard"].map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectGroup></SelectContent>
                  </Select>
                </label>
              )}
            </form.Field>
            <form.Field name="gamemode">
              {(field) => (
                <label className="grid gap-1 text-xs font-semibold uppercase text-muted-foreground">
                  Gamemode
                  <Select value={field.state.value} onValueChange={(value) => { if (value) field.handleChange(value); }}>
                    <SelectTrigger className="h-10 w-full rounded-md"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectGroup>{["survival", "creative", "adventure", "spectator"].map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectGroup></SelectContent>
                  </Select>
                </label>
              )}
            </form.Field>
          </section>

          <form.Field name="eulaAccepted">
            {(field) => (
              <label className="flex gap-3 rounded-md border border-border bg-card p-4 text-sm">
                <Checkbox checked={field.state.value} onCheckedChange={(checked) => field.handleChange(checked === true)} />
                <span>
                  I agree to the Minecraft <a className="text-primary underline" href="https://www.minecraft.net/en-us/eula" target="_blank" rel="noreferrer">EULA</a>.
                  <span className="mt-1 block text-xs text-muted-foreground">Fabricator cannot create or install the server until this is accepted.</span>
                </span>
              </label>
            )}
          </form.Field>

          {formError ? <p className="text-sm text-destructive" role="alert">{formError}</p> : null}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={closeDialog} disabled={create.isPending || install.isPending}>Cancel</Button>
            <Button type="submit" disabled={create.isPending || install.isPending}>
              {create.isPending || install.isPending ? "Creating..." : "Create and install"}
            </Button>
          </div>
        </form>
      )}
    </Dialog>
  );
}
