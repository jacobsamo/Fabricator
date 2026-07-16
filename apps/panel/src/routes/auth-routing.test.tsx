import { isRedirect } from "@tanstack/react-router";
import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { setUnauthorizedHandler } from "@/api/client";
import { clearAuthenticatedSession, unauthenticatedStatus } from "@/lib/auth-session";
import { requireAppAuth } from "@/lib/auth-guard";
import { queryClient } from "@/lib/query-client";
import { queryKeys } from "@/lib/query-keys";
import { router } from "@/router";
import { authErrorFixtures, authFixtures, serverFixtures } from "@/test/fixtures";
import { usePanelApiMocks } from "@/test/msw/server";
import { renderPanelRoute } from "@/test/render";

function redirectOptions(error: unknown) {
  expect(isRedirect(error)).toBe(true);
  return (error as { options: { to?: string; search?: Record<string, unknown> } }).options;
}

function installUnauthorizedRedirectHandler() {
  setUnauthorizedHandler(() => {
    void clearAuthenticatedSession(unauthenticatedStatus).then(() => {
      void router.navigate({
        to: "/login",
        search: { redirect: `${window.location.pathname}${window.location.search}` },
        replace: true,
      });
    });
  });
}

describe("auth route parity", () => {
  it("lets auth-disabled installs enter the rendered app", async () => {
    renderPanelRoute({
      route: "/",
      api: {
        authStatus: authFixtures.disabled,
        servers: serverFixtures.empty,
      },
    });

    expect(await screen.findByText("No servers yet")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Lock" })).not.toBeInTheDocument();
    expect(window.location.pathname).toBe("/");
  });

  it("redirects unauthenticated app routes to login with a redirect query", async () => {
    usePanelApiMocks({ authStatus: authFixtures.unauthenticated });

    let thrown: unknown;
    try {
      await requireAppAuth({ pathname: "/server/survival/overview", search: { tab: "logs" } });
    } catch (error) {
      thrown = error;
    }

    const options = redirectOptions(thrown);
    expect(options.to).toBe("/login");
    expect(options.search).toMatchObject({ redirect: "/server/survival/overview?tab=logs" });
  });

  it("redirects first boot app routes to setup in one guard decision", async () => {
    usePanelApiMocks({ authStatus: authFixtures.needsSetup });

    let thrown: unknown;
    try {
      await requireAppAuth({ pathname: "/server/survival/overview" });
    } catch (error) {
      thrown = error;
    }

    expect(redirectOptions(thrown).to).toBe("/setup");
  });

  it("falls back to login when the auth status call fails", async () => {
    usePanelApiMocks({
      authStatusError: { status: 503, body: authErrorFixtures.statusFailure },
    });

    let thrown: unknown;
    try {
      await requireAppAuth({ pathname: "/" });
    } catch (error) {
      thrown = error;
    }

    const options = redirectOptions(thrown);
    expect(options.to).toBe("/login");
    expect(options.search).toMatchObject({ redirect: "/" });
  });

  it("clears protected session queries and removes redirect search on logout", async () => {
    queryClient.setQueryData(queryKeys.session.servers, serverFixtures.summaries);
    queryClient.setQueryData(queryKeys.session.server("survival"), serverFixtures.detail);

    await clearAuthenticatedSession(unauthenticatedStatus);

    expect(queryClient.getQueryData(queryKeys.session.servers)).toBeUndefined();
    expect(queryClient.getQueryData(queryKeys.session.server("survival"))).toBeUndefined();
    expect(queryClient.getQueryData(queryKeys.auth.status)).toEqual(unauthenticatedStatus);
  });

  it("clears protected session queries before session-expiry redirects", async () => {
    installUnauthorizedRedirectHandler();
    queryClient.setQueryData(queryKeys.session.servers, serverFixtures.summaries);
    queryClient.setQueryData(queryKeys.session.server("creative"), serverFixtures.summaries[1]);
    window.history.replaceState({}, "Test", "/server/survival/overview");

    await clearAuthenticatedSession(unauthenticatedStatus);

    expect(queryClient.getQueryData(queryKeys.session.servers)).toBeUndefined();
    expect(queryClient.getQueryData(queryKeys.session.server("creative"))).toBeUndefined();
    expect(queryClient.getQueryData(queryKeys.auth.status)).toEqual(unauthenticatedStatus);
  });
});
