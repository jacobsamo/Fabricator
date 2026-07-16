import { screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { backupConfigPayload } from "@/forms/backup-config-form";
import { queryClient } from "@/lib/query-client";
import { areServerPropertiesDirty, defaultServerProperties } from "@/lib/server-settings";
import { backupsUiStoreActions } from "@/stores/backups-ui-store";
import { backupFixtures, javaFixtures, playitFixtures, serverFixtures } from "@/test/fixtures";
import { renderPanelRoute } from "@/test/render";

afterEach(() => {
  backupsUiStoreActions.reset();
  queryClient.clear();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("backups route parity", () => {
  it("validates backup config CRUD fields locally", async () => {
    const { user } = renderPanelRoute({ route: "/server/survival/backups" });

    await user.click(await screen.findByRole("button", { name: "Schedules" }));
    await user.click(screen.getByRole("button", { name: /Create config/ }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Name is required.");
  });

  it("starts quick backups and keeps the terminal job state briefly", async () => {
    const { user } = renderPanelRoute({
      route: "/server/survival/backups",
      api: { backupJob: backupFixtures.jobDone },
    });

    await user.click(await screen.findByRole("button", { name: /Quick backup/ }));
    await user.click(screen.getByRole("button", { name: /Start quick backup/ }));

    expect(await screen.findByText(/Active backup job .*done .*complete/i)).toBeInTheDocument();
  });

  it("supports restore reset mode and snapshot deletion", async () => {
    const { user } = renderPanelRoute({ route: "/server/survival/backups" });

    await user.click(await screen.findByRole("button", { name: /Restore/ }));
    await user.click(screen.getByRole("button", { name: /Reset world then restore/ }));
    expect(await screen.findByText(/Active restore job/i)).toBeInTheDocument();

    await waitFor(() => expect(screen.queryByText(/Active restore job/i)).not.toBeInTheDocument(), { timeout: 2500 });
    await user.click(screen.getByRole("button", { name: /Delete/ }));
    await screen.findByText("Delete snapshot");
    await user.click(screen.getAllByRole("button", { name: /^Delete$/ }).at(-1)!);
    await waitFor(() => expect(screen.queryByText("Delete snapshot")).not.toBeInTheDocument());
  });

  it("surfaces retained files when deleting a config without purge", async () => {
    const { user } = renderPanelRoute({ route: "/server/survival/backups" });

    await user.click(await screen.findByRole("button", { name: "Schedules" }));
    await user.click(screen.getByRole("button", { name: /Daily .*snapshots/ }));
    await user.click(screen.getByRole("button", { name: /Delete config/ }));
    await user.click(screen.getByRole("button", { name: /Delete config/ }));

    expect(await screen.findByText("Archive files retained on disk")).toBeInTheDocument();
    expect(screen.getByText(/2 archive files were kept for Daily/)).toBeInTheDocument();
  });

  it("surfaces deleted archive files when purging a config", async () => {
    const { user } = renderPanelRoute({ route: "/server/survival/backups" });

    await user.click(await screen.findByRole("button", { name: "Schedules" }));
    await user.click(screen.getByRole("button", { name: /Daily .*snapshots/ }));
    await user.click(screen.getByRole("button", { name: /Delete config/ }));
    await user.click(screen.getByText("Purge archive files"));
    await user.click(screen.getByRole("button", { name: /Delete config/ }));

    expect(await screen.findByText("Archive files removed from disk")).toBeInTheDocument();
    expect(screen.getByText(/2 archive files were removed for Daily/)).toBeInTheDocument();
  });


  it("renders world import upload progress and upload failure", async () => {
    class FakeUploadXhr {
      static latest: FakeUploadXhr | null = null;
      upload: { onprogress: ((event: ProgressEvent) => void) | null } = { onprogress: null };
      status = 500;
      responseText = JSON.stringify({ error: "Archive rejected" });
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      onabort: (() => void) | null = null;
      open = vi.fn();
      setRequestHeader = vi.fn();

      constructor() {
        FakeUploadXhr.latest = this;
      }

      send() {
        this.upload.onprogress?.({ lengthComputable: true, loaded: 42, total: 100 } as unknown as ProgressEvent);
        window.setTimeout(() => this.onload?.(), 250);
      }

      abort() {
        this.onabort?.();
      }
    }
    vi.stubGlobal("XMLHttpRequest", FakeUploadXhr);
    const { user } = renderPanelRoute({ route: "/server/survival/backups" });

    await user.click(await screen.findByRole("button", { name: /Import world/ }));
    await user.upload(screen.getByLabelText(/World archive/i), new File(["world"], "world.zip", { type: "application/zip" }));
    await user.click(screen.getByRole("button", { name: "Import" }));

    expect(await screen.findByText("Upload progress: 42%")).toBeInTheDocument();
    expect(await screen.findByRole("alert")).toHaveTextContent("Archive rejected");
  });
});

describe("playit route parity", () => {
  it.each([
    [{ status: "unsupported" }, /not available on this platform/i],
    [{ status: "stopped" }, /Enable playit.gg/i],
    [{ status: "starting" }, /Connecting tunnel agent/i],
    [{ status: "claiming", claim_url: "https://playit.gg/claim/test" }, /approve the agent/i],
    [{ status: "error", error_reason: "binary missing" }, /tunnel agent failed/i],
    [playitFixtures.status, /survival.fixture.playit.gg/i],
  ])("renders playit status %#", async (status, expected) => {
    renderPanelRoute({
      route: "/server/survival/playit",
      api: { playitStatus: { ...playitFixtures.status, ...status } },
    });

    expect(await screen.findByText(expected)).toBeInTheDocument();
  });

  it("stops the shared agent", async () => {
    const { user } = renderPanelRoute({
      route: "/server/survival/playit",
      api: { playitStatus: playitFixtures.status },
    });

    await user.click(await screen.findByRole("button", { name: /Disable/ }));
    await user.click(screen.getAllByRole("button", { name: /^Disable$/ }).at(-1)!);
    expect(await screen.findByRole("button", { name: /Enable playit.gg/ })).toBeInTheDocument();
  });

  it("starts the shared agent from stopped state", async () => {
    const { user } = renderPanelRoute({
      route: "/server/survival/playit",
      api: { playitStatus: { status: "stopped", tunnels: [], tunnels_known: false } },
    });

    await user.click(await screen.findByRole("button", { name: /Enable playit.gg/ }));

    expect(await screen.findByText("Connecting tunnel agent...")).toBeInTheDocument();
  });

  it("cancels claim setup and can reset to a different account", async () => {
    const { user, unmount } = renderPanelRoute({
      route: "/server/survival/playit",
      api: { playitStatus: { status: "claiming", claim_url: "https://playit.gg/claim/test", tunnels: [], tunnels_known: false } },
    });

    expect(await screen.findByText(/Open this link/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Cancel setup/ }));
    expect(await screen.findByRole("button", { name: /Enable playit.gg/ })).toBeInTheDocument();

    unmount();
    queryClient.clear();
    const reset = renderPanelRoute({
      route: "/server/survival/playit",
      api: { playitStatus: { status: "claiming", claim_url: "https://playit.gg/claim/test", tunnels: [], tunnels_known: false } },
    });

    await reset.user.click(await screen.findByRole("button", { name: /Use different account/ }));
    expect(await screen.findByRole("button", { name: /Enable playit.gg/ })).toBeInTheDocument();
  });

  it("resets the shared agent", async () => {
    const { user } = renderPanelRoute({
      route: "/server/survival/playit",
      api: { playitStatus: playitFixtures.status },
    });

    await user.click(await screen.findByRole("button", { name: /Reset/ }));
    await user.click(screen.getAllByRole("button", { name: /^Reset$/ }).at(-1)!);
    expect(await screen.findByRole("button", { name: /Enable playit.gg/ })).toBeInTheDocument();
  });
});

describe("properties and settings parity", () => {
  it("tracks dirty property state, basic/expert grouping, and the running edit guard", async () => {
    const { user } = renderPanelRoute({ route: "/server/survival/properties" });

    expect(await screen.findByText("Stop the server before editing configuration.")).toBeInTheDocument();
    expect(screen.queryByLabelText("Force gamemode")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Enable Expert Mode/ }));
    expect(screen.getByRole("checkbox", { name: "Force gamemode" })).toHaveAttribute("aria-disabled", "true");
    expect(screen.getByRole("button", { name: /Save Changes/ })).toBeDisabled();
  });

  it("enables save after a stopped server property edit", async () => {
    const stoppedServer = { ...serverFixtures.detail, status: "stopped", runtime: { status: "stopped" } };
    const { user } = renderPanelRoute({
      route: "/server/survival/properties",
      api: { serverDetail: stoppedServer },
    });

    const name = await screen.findByLabelText("Name");
    await user.clear(name);
    await user.type(name, "Updated Survival");

    expect(screen.getByRole("button", { name: /Save Changes/ })).toBeEnabled();
  });

  it("keeps server property defaults stable", () => {
    const defaults = defaultServerProperties({ ...serverFixtures.detail, port: 25566 });

    expect(defaults.queryPort).toBe(25566);
    expect(defaults.motd).toBe("Fabricator fixture server");
    expect(areServerPropertiesDirty({ ...defaults, maxPlayers: defaults.maxPlayers + 1 }, defaults)).toBe(true);
  });

  it("updates autostart optimistically and rolls back on backend errors", async () => {
    const { user } = renderPanelRoute({
      route: "/server/survival/settings",
      api: { autostartError: { status: 500, body: { error: "Autostart failed" } } },
    });

    const always = await screen.findByRole("radio", { name: /Always start/ });
    const never = screen.getByRole("radio", { name: /Never/ });
    expect(never).toBeChecked();

    await user.click(always);

    expect(await screen.findByText("Autostart failed")).toBeInTheDocument();
    await waitFor(() => expect(never).toBeChecked());
  });

  it("shows Java install progress and supports removal confirmation", async () => {
    const { user } = renderPanelRoute({
      route: "/server/survival/settings",
      api: {
        javaInstalled: javaFixtures.installed,
        javaInstallProgress: { task_id: "java-21", status: "downloading", downloaded: 52_428_800, total: 104_857_600, install_major: 21 },
      },
    });

    await screen.findByText("/srv/fabricator/java/17/bin/java");
    await user.click(screen.getByRole("button", { name: "Remove" }));
    expect(screen.getByText(/Remove Java 17/)).toBeInTheDocument();
    await user.click(within(screen.getByText(/Remove Java 17/).closest("div")!).getByRole("button", { name: "Cancel" }));

    await user.click(screen.getByRole("button", { name: "Install" }));
    expect(await screen.findByText(/Downloading 50.0 MB of 100 MB \(50%\)/)).toBeInTheDocument();
  });

  it("shows Java terminal install success", async () => {
    const { user } = renderPanelRoute({
      route: "/server/survival/settings",
      api: {
        javaInstalled: { managed: [], system: { installed: false } },
        javaInstallProgress: javaFixtures.installProgress,
      },
    });

    await user.click(await screen.findByRole("button", { name: "Install" }));

    expect(await screen.findByRole("status")).toHaveTextContent("Java 21 installed.");
  });

  it("validates password changes and surfaces backend and 401 errors", async () => {
    const { user, unmount } = renderPanelRoute({ route: "/server/survival/settings" });

    await user.type(await screen.findByLabelText("Current password"), "old-password");
    await user.type(screen.getByLabelText("New password"), "short");
    await user.type(screen.getByLabelText("Confirm new password"), "short");
    await user.click(screen.getByRole("button", { name: /Change password/ }));
    expect(await screen.findByRole("alert")).toHaveTextContent("New password must be at least 8 characters.");

    unmount();
    const backend = renderPanelRoute({
      route: "/server/survival/settings",
      api: { changePasswordError: { status: 400, body: { error: "Current password is incorrect." } } },
    });
    await backend.user.type(await screen.findByLabelText("Current password"), "old-password");
    await backend.user.type(screen.getByLabelText("New password"), "new-password");
    await backend.user.type(screen.getByLabelText("Confirm new password"), "new-password");
    await backend.user.click(screen.getByRole("button", { name: /Change password/ }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Current password is incorrect.");

    backend.unmount();
    const unauthorized = renderPanelRoute({
      route: "/server/survival/settings",
      api: { changePasswordError: { status: 401, body: { error: "Session expired." } } },
    });
    await unauthorized.user.type(await screen.findByLabelText("Current password"), "old-password");
    await unauthorized.user.type(screen.getByLabelText("New password"), "new-password");
    await unauthorized.user.type(screen.getByLabelText("Confirm new password"), "new-password");
    await unauthorized.user.click(screen.getByRole("button", { name: /Change password/ }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Session expired.");
  });

  it("normalizes backup config payloads", () => {
    expect(backupConfigPayload({
      name: " Daily ",
      storagePath: " /backups ",
      maxSnapshots: "3",
      flush: true,
      shutdown: false,
      compress: true,
      exclusions: "logs/**\n\n crash-reports/** ",
      scheduleEnabled: true,
      frequencyHours: "24",
      timeOfDay: "03:00",
    })).toEqual({
      name: "Daily",
      storagePath: "/backups",
      maxSnapshots: 3,
      flush: true,
      shutdown: false,
      compress: true,
      exclusions: ["logs/**", "crash-reports/**"],
      schedule: { enabled: true, frequencyHours: 24, timeOfDay: "03:00" },
    });
  });
});
