import {
  Outlet,
  createRootRoute,
  createRoute,
  createRouter,
  redirect,
} from "@tanstack/react-router";

import { AppShell } from "@/components/app/app-shell";
import { LoginPage } from "@/routes/login";
import { ServerListPage } from "@/routes/index";
import { SetupPage } from "@/routes/setup";
import { guardLoginRoute, guardSetupRoute, requireAppAuth } from "@/lib/auth-guard";
import { ServerLayout } from "@/routes/server/$serverId/route";
import { BackupsPage } from "@/routes/server/$serverId/backups";
import { ConsolePage } from "@/routes/server/$serverId/console";
import { FilesPage } from "@/routes/server/$serverId/files";
import { ModsPage } from "@/routes/server/$serverId/mods";
import { OverviewPage } from "@/routes/server/$serverId/overview";
import { PlayitPage } from "@/routes/server/$serverId/playit";
import { PlayersPage } from "@/routes/server/$serverId/players";
import { PropertiesPage } from "@/routes/server/$serverId/properties";
import { SettingsPage } from "@/routes/server/$serverId/settings";

const rootRoute = createRootRoute({
  component: () => <Outlet />,
});

const appRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "app",
  beforeLoad: ({ location }) => requireAppAuth(location),
  component: AppShell,
});

const indexRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/",
  component: ServerListPage,
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: typeof search.redirect === "string" ? search.redirect : undefined,
  }),
  beforeLoad: guardLoginRoute,
  component: LoginPage,
});

const setupRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/setup",
  beforeLoad: guardSetupRoute,
  component: SetupPage,
});

const serverRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/server/$serverId",
  component: ServerLayout,
});

const serverIndexRoute = createRoute({
  getParentRoute: () => serverRoute,
  path: "/",
  beforeLoad: ({ params }) => {
    throw redirect({ to: "/server/$serverId/overview", params });
  },
});

const overviewRoute = createRoute({
  getParentRoute: () => serverRoute,
  path: "/overview",
  component: OverviewPage,
});

const consoleRoute = createRoute({
  getParentRoute: () => serverRoute,
  path: "/console",
  component: ConsolePage,
});

const playersRoute = createRoute({
  getParentRoute: () => serverRoute,
  path: "/players",
  component: PlayersPage,
});

const modsRoute = createRoute({
  getParentRoute: () => serverRoute,
  path: "/mods",
  component: ModsPage,
});

const filesRoute = createRoute({
  getParentRoute: () => serverRoute,
  path: "/files",
  component: FilesPage,
});

const backupsRoute = createRoute({
  getParentRoute: () => serverRoute,
  path: "/backups",
  component: BackupsPage,
});

const playitRoute = createRoute({
  getParentRoute: () => serverRoute,
  path: "/playit",
  component: PlayitPage,
});

const propertiesRoute = createRoute({
  getParentRoute: () => serverRoute,
  path: "/properties",
  component: PropertiesPage,
});

const settingsRoute = createRoute({
  getParentRoute: () => serverRoute,
  path: "/settings",
  component: SettingsPage,
});

const routeTree = rootRoute.addChildren([
  loginRoute,
  setupRoute,
  appRoute.addChildren([
    indexRoute,
    serverRoute.addChildren([
      serverIndexRoute,
      overviewRoute,
      consoleRoute,
      playersRoute,
      modsRoute,
      filesRoute,
      backupsRoute,
      playitRoute,
      propertiesRoute,
      settingsRoute,
    ]),
  ]),
]);

export const router = createRouter({
  routeTree,
  defaultPreload: "intent",
  defaultPreloadStaleTime: 30_000,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
