import type { ServerSummary } from "@/api/schemas";

const RUNTIME_KNOWN_STATUSES = new Set(["running", "stopped"]);

export function getEffectiveStatus(server: ServerSummary | null | undefined, fallback = "pending") {
  const persisted = server?.status;
  const runtime = server?.runtime?.status;
  if (persisted && !RUNTIME_KNOWN_STATUSES.has(persisted)) {
    return persisted;
  }
  return runtime || persisted || fallback;
}

export function getStatusLabel(status: string | null | undefined) {
  if (status === "running") return "Running";
  if (status === "stopped") return "Stopped";
  if (status === "pending") return "Install Required";
  if (status === "installing") return "Installing";
  if (status === "failed") return "Failed";
  return status ? `${status.charAt(0).toUpperCase()}${status.slice(1)}` : "Unknown";
}

export function getServerMeta(server: ServerSummary | null | undefined) {
  const loader = server?.loader ? `${server.loader.charAt(0).toUpperCase()}${server.loader.slice(1)}` : "";
  const version = server?.version || "";
  const status = getStatusLabel(getEffectiveStatus(server, "unknown"));
  return [loader && version ? `${loader} ${version}` : loader || version, status].filter(Boolean).join(" · ");
}

export function isVanillaServer(server: ServerSummary | null | undefined) {
  return String(server?.loader || "").toLowerCase() === "vanilla";
}

export function statusDotClass(status: string | null | undefined) {
  if (status === "running") return "bg-success";
  if (status === "installing") return "bg-primary";
  if (status === "pending") return "bg-warning";
  if (status === "failed") return "bg-destructive";
  return "bg-muted-foreground";
}
