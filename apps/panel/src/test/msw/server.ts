import { setupServer } from "msw/node";

import { createPanelApiHandlers, type PanelApiFixtureOverrides } from "@/test/msw/handlers";

export const mockServer = setupServer(...createPanelApiHandlers());

export function usePanelApiMocks(overrides: PanelApiFixtureOverrides = {}) {
  mockServer.use(...createPanelApiHandlers(overrides));
}

export type { PanelApiFixtureOverrides };
