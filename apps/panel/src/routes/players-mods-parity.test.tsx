import { afterEach, describe, expect, it, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { screen, waitFor, within } from "@testing-library/react";

import { setUnauthorizedHandler } from "@/api/client";
import { authFixtures, playerFixtures, serverFixtures } from "@/test/fixtures";
import { queryClient } from "@/lib/query-client";
import { mockServer } from "@/test/msw/server";
import { renderPanelRoute } from "@/test/render";
import { modsUiStoreActions } from "@/stores/mods-ui-store";

function playerRow(name: string) {
  const text = screen.getByText(name);
  const row = text.closest("li");
  if (!row) throw new Error(`No row for ${name}`);
  return within(row);
}

function addPlayerForm() {
  const input = screen.getByPlaceholderText("Add a player by name...");
  const form = input.closest("form");
  if (!form) throw new Error("No add-player form");
  return within(form);
}

function basePlayersState() {
  return {
    ...playerFixtures.state,
    knownPlayers: [
      { name: "Alex", uuid: "00000000-0000-0000-0000-000000000001", expiresOn: "2026-08-14T00:00:00Z" },
      { name: "Steve", uuid: "00000000-0000-0000-0000-000000000002", expiresOn: "2026-08-13T00:00:00Z" },
    ],
    whitelistActive: true,
    onlineMode: true,
  };
}

afterEach(() => {
  modsUiStoreActions.reset();
  vi.restoreAllMocks();
});

describe("players route parity", () => {
  it("uses online players only while the server is running", async () => {
    const running = renderPanelRoute({
      route: "/server/survival/players",
      api: {
        authStatus: authFixtures.authenticated,
        serverDetail: serverFixtures.detail,
        playersState: basePlayersState(),
        onlinePlayers: playerFixtures.online,
      },
    });

    expect(await screen.findByText("Alex")).toBeInTheDocument();
    running.unmount();
    queryClient.clear();

    renderPanelRoute({
      route: "/server/survival/players",
      api: {
        authStatus: authFixtures.authenticated,
        serverDetail: { ...serverFixtures.detail, status: "stopped" },
        playersState: basePlayersState(),
        onlinePlayers: playerFixtures.online,
      },
    });

    expect(await screen.findByText("Alex")).toBeInTheDocument();
    expect(playerRow("Alex").queryByText("online")).not.toBeInTheDocument();
  });

  it("adds a player by name after a successful whitelist mutation", async () => {
    const state = basePlayersState();
    const { user } = renderPanelRoute({ route: "/server/survival/players", api: { playersState: state } });
    mockServer.use(
      http.post("/api/servers/:serverId/players/whitelist", async ({ request }) => {
        const body = (await request.json()) as { name: string };
        state.whitelist = [...state.whitelist, { name: body.name, uuid: "00000000-0000-0000-0000-000000000099" }];
        return HttpResponse.json({ name: body.name, uuid: "00000000-0000-0000-0000-000000000099" });
      }),
    );

    await user.type(await screen.findByPlaceholderText("Add a player by name..."), "Herobrine");
    await user.click(addPlayerForm().getByRole("button", { name: "Whitelist" }));

    expect(await screen.findByText("Herobrine")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Add a player by name...")).toHaveValue("");
  });

  it("rolls back failed whitelist, op, ban, and IP-ban mutations", async () => {
    const { user } = renderPanelRoute({ route: "/server/survival/players", api: { playersState: basePlayersState() } });
    await screen.findByText("Alex");

    mockServer.use(
      http.post("/api/servers/:serverId/players/whitelist", () => HttpResponse.json({ error: "Whitelist failed" }, { status: 500 })),
      http.delete("/api/servers/:serverId/players/whitelist", () => HttpResponse.json({ error: "Whitelist remove failed" }, { status: 500 })),
      http.post("/api/servers/:serverId/players/ops", () => HttpResponse.json({ error: "Op failed" }, { status: 500 })),
      http.post("/api/servers/:serverId/players/bans", () => HttpResponse.json({ error: "Ban failed" }, { status: 500 })),
      http.post("/api/servers/:serverId/players/bans/ip", () => HttpResponse.json({ error: "IP ban failed" }, { status: 500 })),
    );

    await user.type(screen.getByPlaceholderText("Add a player by name..."), "FailedWhitelist");
    await user.click(addPlayerForm().getByRole("button", { name: "Whitelist" }));
    await waitFor(() => expect(screen.queryByText("FailedWhitelist")).not.toBeInTheDocument());
    expect(screen.getByPlaceholderText("Add a player by name...")).toHaveValue("FailedWhitelist");

    await user.clear(screen.getByPlaceholderText("Add a player by name..."));
    await user.type(screen.getByPlaceholderText("Add a player by name..."), "FailedOp");
    await user.click(addPlayerForm().getByRole("button", { name: "Op" }));
    await waitFor(() => expect(screen.queryByText("FailedOp")).not.toBeInTheDocument());

    await user.clear(screen.getByPlaceholderText("Add a player by name..."));
    await user.type(screen.getByPlaceholderText("Add a player by name..."), "FailedBan");
    await user.click(addPlayerForm().getByRole("button", { name: "Ban" }));
    await waitFor(() => expect(screen.queryByText("FailedBan")).not.toBeInTheDocument());

    await user.click(playerRow("Alex").getByRole("button", { name: "Whitelisted" }));
    await waitFor(() => expect(playerRow("Alex").getByRole("button", { name: "Whitelisted" })).toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: "Manage" }));
    await user.type(screen.getByPlaceholderText("IP or wildcard (e.g. 192.168.*)"), "192.168.1.10");
    await user.click(screen.getByRole("button", { name: "Ban IP" }));
    await waitFor(() => expect(screen.queryByText("192.168.1.10")).not.toBeInTheDocument());
    expect(screen.getByPlaceholderText("IP or wildcard (e.g. 192.168.*)")).toHaveValue("192.168.1.10");
  });

  it("notifies the session expiry handler when a player mutation receives 401", async () => {
    const onUnauthorized = vi.fn();
    setUnauthorizedHandler(onUnauthorized);
    const { user } = renderPanelRoute({ route: "/server/survival/players", api: { playersState: basePlayersState() } });
    mockServer.use(
      http.post("/api/servers/:serverId/players/whitelist", () => HttpResponse.json({ error: "Session expired" }, { status: 401 })),
    );

    await user.type(await screen.findByPlaceholderText("Add a player by name..."), "ExpiredSession");
    await user.click(addPlayerForm().getByRole("button", { name: "Whitelist" }));

    await waitFor(() => expect(onUnauthorized).toHaveBeenCalledTimes(1));
  });
});

describe("mods and Modrinth route parity", () => {
  it("filters installed mods and sends selected filenames for bulk delete", async () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(true);
    let deletedFilenames: string[] | null = null;
    const { user } = renderPanelRoute({ route: "/server/survival/mods" });
    mockServer.use(
      http.delete("/api/servers/:serverId/mods", async ({ request }) => {
        deletedFilenames = ((await request.json()) as { filenames: string[] }).filenames;
        return HttpResponse.json({ deleted: deletedFilenames, errors: [] });
      }),
    );

    await user.type(await screen.findByPlaceholderText("Search installed mods..."), "lithium");

    expect(screen.queryByText("Fabric API")).not.toBeInTheDocument();
    expect(screen.getByText("Lithium")).toBeInTheDocument();

    await user.click(screen.getByRole("checkbox", { name: "Select Lithium" }));
    await user.click(screen.getByRole("button", { name: "Delete 1 mod" }));

    await waitFor(() => expect(deletedFilenames).toEqual(["lithium.jar"]));
    expect(confirm).toHaveBeenCalledWith("Delete 1 selected mod file?");
  });

  it("rolls back a failed single installed-mod delete and targets the backend filename", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    let deletedPath = "";
    const { user } = renderPanelRoute({ route: "/server/survival/mods" });
    await screen.findByText("Lithium");
    mockServer.use(
      http.delete("/api/servers/:serverId/mods/:modName", ({ params }) => {
        deletedPath = String(params.modName);
        return HttpResponse.json({ error: "Delete failed" }, { status: 500 });
      }),
    );

    await user.click(playerRow("Lithium").getByRole("button", { name: "Remove" }));

    await waitFor(() => expect(deletedPath).toBe("lithium.jar"));
    expect(await screen.findByText("Lithium")).toBeInTheDocument();
  });

  it("keeps Modrinth search results available after an install failure", async () => {
    const { user } = renderPanelRoute({ route: "/server/survival/mods" });
    mockServer.use(
      http.post("/api/modrinth/mod/:modId/install", () => HttpResponse.json({ error: "Install failed" }, { status: 500 })),
    );
    await user.click(await screen.findByRole("button", { name: "Browse mods" }));
    await waitFor(() => expect(screen.getAllByText("Fabric API").length).toBeGreaterThan(1));

    await user.click(screen.getByRole("button", { name: "Install" }));

    await waitFor(() => expect(screen.getByRole("button", { name: "Install" })).toBeEnabled());
    expect(screen.getAllByText("Fabric API").length).toBeGreaterThan(1);
  });

  it("requires confirmation before replacing an active modpack and sends clean install options", async () => {
    const activeServer = {
      ...serverFixtures.detail,
      modpack: { projectId: "old-pack", name: "Old Pack", version: "1.0.0", mcVersion: "1.21.4", loaders: ["fabric"] },
    };
    const confirm = vi.spyOn(window, "confirm").mockReturnValueOnce(false).mockReturnValueOnce(true);
    let installBody: Record<string, unknown> | null = null;
    const { user } = renderPanelRoute({
      route: "/server/survival/mods",
      api: { serverDetail: activeServer },
    });
    mockServer.use(
      http.post("/api/modrinth/modpack/:projectId/install", async ({ request }) => {
        installBody = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({ jobId: "modpack-1" });
      }),
    );

    await user.click(await screen.findByRole("button", { name: "Browse modpacks" }));
    await waitFor(() => expect(screen.getAllByText("Fabric API").length).toBeGreaterThan(1));

    await user.click(screen.getByRole("button", { name: "Replace" }));
    expect(installBody).toBeNull();

    await user.click(screen.getByRole("button", { name: "Replace" }));
    await waitFor(() =>
      expect(installBody).toMatchObject({
        server_id: "survival",
        mc_version: "1.21.4",
        loader: "fabric",
        clean_install: true,
        create_backup: true,
        allow_missing: false,
        mod_side_overrides: null,
      }),
    );
    expect(confirm).toHaveBeenCalledWith("Replace the current modpack with Fabric API? Fabricator will request a backup before installing.");
  });
});
