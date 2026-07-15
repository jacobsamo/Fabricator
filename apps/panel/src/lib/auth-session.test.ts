import { describe, expect, it } from "vitest";

import { authenticatedStatus, clearAuthenticatedSession, unauthenticatedStatus } from "@/lib/auth-session";
import { queryClient } from "@/lib/query-client";
import { isSessionQueryKey, queryKeys } from "@/lib/query-keys";

describe("auth session cache boundary", () => {
  it("recognizes only session-rooted query keys as protected data", () => {
    expect(isSessionQueryKey(queryKeys.session.servers)).toBe(true);
    expect(isSessionQueryKey(queryKeys.session.server("survival"))).toBe(true);
    expect(isSessionQueryKey(queryKeys.auth.status)).toBe(false);
    expect(isSessionQueryKey(["server", "survival"])).toBe(false);
  });

  it("clears protected session queries and leaves auth status explicit", async () => {
    queryClient.setQueryData(queryKeys.auth.status, authenticatedStatus);
    queryClient.setQueryData(queryKeys.session.servers, [{ id: "survival" }]);
    queryClient.setQueryData(queryKeys.session.server("survival"), { id: "survival" });

    await clearAuthenticatedSession(unauthenticatedStatus);

    expect(queryClient.getQueryData(queryKeys.auth.status)).toEqual(unauthenticatedStatus);
    expect(queryClient.getQueryData(queryKeys.session.servers)).toBeUndefined();
    expect(queryClient.getQueryData(queryKeys.session.server("survival"))).toBeUndefined();
  });
});
