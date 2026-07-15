import "@testing-library/jest-dom/vitest";

import { cleanup } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, vi } from "vitest";

import { setUnauthorizedHandler } from "@/api/client";
import { queryClient } from "@/lib/query-client";
import { mockServer } from "@/test/msw/server";

beforeAll(() => {
  window.scrollTo = vi.fn();
  mockServer.listen({ onUnhandledRequest: "error" });
});

afterEach(() => {
  cleanup();
  setUnauthorizedHandler(null);
  queryClient.clear();
  mockServer.resetHandlers();
  window.history.replaceState({}, "Test", "/");
});

afterAll(() => {
  mockServer.close();
});
