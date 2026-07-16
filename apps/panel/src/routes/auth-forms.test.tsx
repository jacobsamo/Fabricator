import { screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { authErrorFixtures, authFixtures } from "@/test/fixtures";
import { renderPanelRoute } from "@/test/render";

describe("auth form routes", () => {
  it("keeps empty login validation local to the login form", async () => {
    const { user } = renderPanelRoute({
      route: "/login",
      api: { authStatus: authFixtures.unauthenticated },
    });

    await user.click(await screen.findByRole("button", { name: "Unlock" }));

    expect(screen.getByText("Enter your password.")).toBeInTheDocument();
    expect(window.location.pathname).toBe("/login");
  });

  it("keeps rejected login attempts on /login", async () => {
    const { user } = renderPanelRoute({
      route: "/login?redirect=/server/survival/overview",
      api: { authStatus: authFixtures.unauthenticated },
    });

    await user.type(await screen.findByPlaceholderText("Password"), "wrong-password");
    await user.click(screen.getByRole("button", { name: "Unlock" }));

    expect(await screen.findByText("Incorrect password.")).toBeInTheDocument();
    expect(window.location.pathname).toBe("/login");
  });

  it("validates setup password mismatch before posting", async () => {
    const { user } = renderPanelRoute({
      route: "/setup",
      api: { authStatus: authFixtures.needsSetup },
    });

    await user.type(await screen.findByPlaceholderText("Password"), "long-enough");
    await user.type(screen.getByPlaceholderText("Confirm password"), "different-password");
    await user.click(screen.getByRole("button", { name: "Create password" }));

    expect(await screen.findByText("Passwords must match.")).toBeInTheDocument();
    expect(window.location.pathname).toBe("/setup");
  });

  it("keeps rejected setup attempts on /setup", async () => {
    const { user } = renderPanelRoute({
      route: "/setup",
      api: {
        authStatus: authFixtures.needsSetup,
        setupError: { status: 500, body: authErrorFixtures.setupFailure },
      },
    });

    await user.type(await screen.findByPlaceholderText("Password"), "long-enough");
    await user.type(screen.getByPlaceholderText("Confirm password"), "long-enough");
    await user.click(screen.getByRole("button", { name: "Create password" }));

    expect(await screen.findByText("Unable to create operator password.")).toBeInTheDocument();
    expect(window.location.pathname).toBe("/setup");
  });

  it("navigates setup completion back to the app", async () => {
    const { user } = renderPanelRoute({
      route: "/setup",
      api: { authStatus: authFixtures.needsSetup, servers: [] },
    });

    await user.type(await screen.findByPlaceholderText("Password"), "long-enough");
    await user.type(screen.getByPlaceholderText("Confirm password"), "long-enough");
    await user.click(screen.getByRole("button", { name: "Create password" }));

    await waitFor(() => expect(window.location.pathname).toBe("/"));
  });
});
