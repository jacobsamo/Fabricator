import "@testing-library/jest-dom/vitest";

import { cleanup } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, vi } from "vitest";

import { setUnauthorizedHandler } from "@/api/client";
import { queryClient } from "@/lib/query-client";
import { appStoreActions } from "@/stores/app-store";
import { backupsUiStoreActions } from "@/stores/backups-ui-store";
import { fileEditorStoreActions } from "@/stores/file-editor-store";
import { hotkeysStoreActions } from "@/stores/hotkeys-store";
import { modsUiStoreActions } from "@/stores/mods-ui-store";
import { serverUiStoreActions } from "@/stores/server-ui-store";
import { mockServer } from "@/test/msw/server";

beforeAll(() => {
  window.scrollTo = vi.fn();
  mockServer.listen({ onUnhandledRequest: "error" });
});

afterEach(() => {
  cleanup();
  setUnauthorizedHandler(null);
  appStoreActions.reset();
  backupsUiStoreActions.reset();
  fileEditorStoreActions.closeFile();
  hotkeysStoreActions.reset();
  modsUiStoreActions.reset();
  serverUiStoreActions.reset();
  queryClient.clear();
  mockServer.resetHandlers();
  window.history.replaceState({}, "Test", "/");
});

afterAll(() => {
  mockServer.close();
});
