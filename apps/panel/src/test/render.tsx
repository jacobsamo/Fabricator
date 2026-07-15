import { createContext, type ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { render, type RenderResult } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { queryClient } from "@/lib/query-client";
import { router } from "@/router";
import { usePanelApiMocks, type PanelApiFixtureOverrides } from "@/test/msw/server";

export type PanelTestStores = Record<string, unknown>;

export const PanelTestStoreContext = createContext<PanelTestStores>({});

type RenderPanelOptions = {
  route?: string;
  api?: PanelApiFixtureOverrides;
  stores?: PanelTestStores;
};

export function renderPanelRoute(options: RenderPanelOptions = {}): RenderResult & {
  user: ReturnType<typeof userEvent.setup>;
  stores: PanelTestStores;
} {
  const stores = options.stores ?? {};
  const route = options.route ?? "/";

  usePanelApiMocks(options.api);
  window.history.pushState({}, "Test", route);

  const result = render(
    <PanelTestProviders stores={stores}>
      <RouterProvider router={router} />
    </PanelTestProviders>,
  );

  return {
    ...result,
    user: userEvent.setup(),
    stores,
  };
}

export function PanelTestProviders({ children, stores = {} }: { children: ReactNode; stores?: PanelTestStores }) {
  return (
    <PanelTestStoreContext.Provider value={stores}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </PanelTestStoreContext.Provider>
  );
}
