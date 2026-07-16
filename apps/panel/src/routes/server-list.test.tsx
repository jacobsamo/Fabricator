import { screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { authFixtures, serverFixtures } from "@/test/fixtures";
import { renderPanelRoute } from "@/test/render";

describe("server list route", () => {
  it("renders the empty server state from fixtures", async () => {
    renderPanelRoute({
      route: "/",
      api: {
        authStatus: authFixtures.authenticated,
        servers: serverFixtures.empty,
      },
    });

    expect(await screen.findByText("No servers yet")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Create server/ })).toBeInTheDocument();
  });

  it("redirects from / to the first server overview when servers exist", async () => {
    renderPanelRoute({
      route: "/",
      api: {
        authStatus: authFixtures.authenticated,
        servers: serverFixtures.summaries,
        serverDetail: serverFixtures.detail,
      },
    });

    expect(await screen.findByText("Overview")).toBeInTheDocument();
    expect(await screen.findByText("Performance")).toBeInTheDocument();
    expect(await screen.findByText("Recent logs")).toBeInTheDocument();
    await waitFor(() => expect(window.location.pathname).toBe("/server/survival/overview"));
  });

  it("renders the server API error state", async () => {
    renderPanelRoute({
      route: "/",
      api: {
        authStatus: authFixtures.authenticated,
        serversError: { status: 500, body: serverFixtures.apiError },
      },
    });

    expect(await screen.findByText("Unable to load servers", {}, { timeout: 3000 })).toBeInTheDocument();
    expect(screen.getByText("Failed to load servers")).toBeInTheDocument();
    expect(window.location.pathname).toBe("/");
  });

  it("opens the create server dialog, requires EULA acceptance, and starts install", async () => {
    const requests: string[] = [];
    const { user } = renderPanelRoute({
      route: "/",
      api: {
        authStatus: authFixtures.authenticated,
        servers: serverFixtures.empty,
        serverDetail: serverFixtures.detail,
        onRequest: (request) => requests.push(`${request.method} ${new URL(request.url).pathname}`),
      },
    });

    await user.click(await screen.findByRole("button", { name: /Create server/ }));
    expect(await screen.findByRole("dialog", { name: "Create New Server" })).toBeInTheDocument();

    await user.type(screen.getByLabelText(/Server name/i), "Test Server");
    await user.click(screen.getByRole("combobox", { name: /Minecraft version/i }));
    await user.click(await screen.findByRole("option", { name: "1.21.4" }));
    await user.click(screen.getByRole("button", { name: /Create and install/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Minecraft EULA");

    await user.click(screen.getByRole("checkbox", { name: /I agree to the Minecraft/i }));
    await user.click(screen.getByRole("button", { name: /Create and install/i }));

    await waitFor(() => expect(requests).toContain("POST /api/servers"));
    await waitFor(() => expect(requests).toContain("POST /api/servers/survival/install"));
    await waitFor(() => expect(window.location.pathname).toBe("/server/survival/overview"));
  });
});
