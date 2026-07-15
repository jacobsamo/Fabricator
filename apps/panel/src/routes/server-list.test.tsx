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
});
