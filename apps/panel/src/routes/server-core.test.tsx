import { screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { mergeLogLines } from "@/components/server/log-utils";
import { copyText } from "@/lib/files";
import { queryClient } from "@/lib/query-client";
import { queryKeys } from "@/lib/query-keys";
import { logFixtures, serverFixtures } from "@/test/fixtures";
import { renderPanelRoute } from "@/test/render";

function renderServerRoute(route: string, serverDetail: unknown = serverFixtures.running, extraApi = {}) {
  return renderPanelRoute({
    route,
    api: {
      serverDetail,
      servers: serverFixtures.summaries,
      ...extraApi,
    },
  });
}

describe("core server route parity", () => {
  it("merges console stdout and stderr by timestamp and filters levels", () => {
    const lines = mergeLogLines(logFixtures.mixed.stdout, logFixtures.mixed.stderr);

    expect(lines.map((line) => line.message)).toEqual([
      "[Server thread/INFO]: Done (2.34s)! For help, type \"help\"",
      "[Server thread/WARN]: Missing config value",
      "SEVERE: Port already in use",
      "Plain stderr without level",
    ]);
    expect(lines.filter((line) => line.level === "ERROR").map((line) => line.message)).toEqual([
      "SEVERE: Port already in use",
      "Plain stderr without level",
    ]);

    const timestamped = mergeLogLines(logFixtures.mixed.stdout, logFixtures.mixed.stderr.slice(0, 1));
    expect(timestamped.map((line) => line.message)).toEqual([
      "[Server thread/WARN]: Missing config value",
      "SEVERE: Port already in use",
      "[Server thread/INFO]: Done (2.34s)! For help, type \"help\"",
    ]);
  });

  it("disables console commands when stopped", async () => {
    renderServerRoute("/server/survival/console", serverFixtures.stopped, { logs: { stdout: [], stderr: [] } });

    expect(await screen.findByPlaceholderText("Server not running")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Send" })).toBeDisabled();
  });

  it.each([
    [serverFixtures.running, "Running"],
    [serverFixtures.stopped, "Stopped"],
    [serverFixtures.pending, "Install Required"],
    [serverFixtures.installing, "Installing"],
    [serverFixtures.failed, "Failed"],
  ])("renders the effective status for %s", async (serverDetail, label) => {
    renderServerRoute("/server/survival/files", serverDetail);

    expect((await screen.findAllByText(label)).length).toBeGreaterThan(0);
  });

  it("keeps persisted in-flight status ahead of runtime stopped", async () => {
    renderServerRoute("/server/survival/files", serverFixtures.installing);

    expect(await screen.findByText("Installing")).toBeInTheDocument();
    expect(screen.queryByText("Stopped")).not.toBeInTheDocument();
  });

  it("renders overview stats, recent logs, active modpack, and Vue quick links", async () => {
    queryClient.setQueryData(queryKeys.session.serverLogs("survival", 200), logFixtures.recent);
    renderServerRoute("/server/survival/overview", serverFixtures.running, { logs: logFixtures.recent });

    expect(await screen.findByText("Better MC")).toBeInTheDocument();
    expect(screen.getAllByText("Players")).toHaveLength(2);
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("/20")).toBeInTheDocument();
    expect(screen.getByText("2h 14m")).toBeInTheDocument();
    expect(screen.getByText("v32")).toBeInTheDocument();
    expect(await screen.findByText(/Starting minecraft server/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Backups Manage snapshots/ })).toHaveAttribute("href", "/server/survival/backups");
    expect(screen.getByRole("link", { name: /Console View logs/ })).toHaveAttribute("href", "/server/survival/console");
    expect(screen.getByRole("link", { name: /Properties server\.properties/ })).toHaveAttribute("href", "/server/survival/properties");
    expect(screen.getByRole("link", { name: /World Manage in settings/ })).toHaveAttribute("href", "/server/survival/settings");
  });

  it("toggles console auto-scroll state", async () => {
    const { user } = renderServerRoute("/server/survival/console", serverFixtures.running, { logs: logFixtures.mixed });

    const toggle = await screen.findByRole("button", { name: "Auto-scroll on" });
    expect(toggle).toHaveAttribute("aria-pressed", "true");

    await user.click(toggle);

    expect(screen.getByRole("button", { name: "Auto-scroll off" })).toHaveAttribute("aria-pressed", "false");
  });

  it("handles files breadcrumbs, text gating, save failure, and dirty discard", async () => {
    const { user } = renderServerRoute("/server/survival/files", serverFixtures.running, {
      saveFileError: { status: 500, body: { error: "Save failed" } },
    });

    expect(await screen.findByText("server.properties")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "server" })).toBeDisabled();
    expect(screen.getByText("server.jar")).toBeInTheDocument();
    expect(screen.getByText("read-only")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /server\.jar/ }));
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /server\.properties/ }));
    const editor = await screen.findByRole("textbox");
    await user.type(editor, "\nview-distance=12");
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findByText("Save failed")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /world/ }));
    expect(await screen.findByRole("dialog", { name: "Discard unsaved changes?" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Keep editing" }));
    expect(screen.getByRole("textbox")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /world/ }));
    await user.click(screen.getByRole("button", { name: "Discard changes" }));

    expect(await screen.findByText("This folder is empty.")).toBeInTheDocument();
    const breadcrumbs = screen.getByRole("navigation", { name: "Path" });
    expect(within(breadcrumbs).getByRole("button", { name: "server" })).toBeInTheDocument();
    expect(within(breadcrumbs).getByRole("button", { name: "world" })).toBeDisabled();
  });

  it("falls back to execCommand for file path copy", async () => {
    const clipboardDescriptor = Object.getOwnPropertyDescriptor(Navigator.prototype, "clipboard");
    Object.defineProperty(navigator, "clipboard", { value: undefined, configurable: true });
    Object.defineProperty(document, "execCommand", { value: vi.fn(() => true), configurable: true });

    expect(await copyText("/srv/fabricator/servers/survival")).toBe(true);
    expect(document.execCommand).toHaveBeenCalledWith("copy");
    delete (document as Partial<Document>).execCommand;
    if (clipboardDescriptor) {
      Object.defineProperty(Navigator.prototype, "clipboard", clipboardDescriptor);
    } else {
      Object.defineProperty(navigator, "clipboard", { value: undefined, configurable: true });
    }
  });

  it("polls logs on overview but not on inactive files route initial load", async () => {
    const overviewRequests: string[] = [];
    const overview = renderServerRoute("/server/survival/overview", serverFixtures.running, {
      onRequest: (request: Request) => overviewRequests.push(new URL(request.url).pathname),
    });

    await screen.findByText("Recent logs");
    await waitFor(() => expect(overviewRequests.some((path) => path.endsWith("/logs"))).toBe(true));
    overview.unmount();

    const fileRequests: string[] = [];
    renderServerRoute("/server/survival/files", serverFixtures.running, {
      onRequest: (request: Request) => fileRequests.push(new URL(request.url).pathname),
    });

    await screen.findAllByText("server.properties");
    expect(fileRequests.some((path) => path.endsWith("/logs"))).toBe(false);
  });
});
