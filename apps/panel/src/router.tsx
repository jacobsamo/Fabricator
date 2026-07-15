import {
  Outlet,
  createRootRoute,
  createRoute,
  createRouter,
  lazyRouteComponent,
  redirect,
} from "@tanstack/react-router";

import { AppShell } from "@/components/app/app-shell";
import { guardLoginRoute, guardSetupRoute, requireAppAuth } from "@/lib/auth-guard";

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
  component: lazyRouteComponent(() => import("@/routes/index"), "ServerListPage"),
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: typeof search.redirect === "string" ? search.redirect : undefined,
  }),
  beforeLoad: guardLoginRoute,
  component: lazyRouteComponent(() => import("@/routes/login"), "LoginPage"),
});

const setupRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/setup",
  beforeLoad: guardSetupRoute,
  component: lazyRouteComponent(() => import("@/routes/setup"), "SetupPage"),
});

const serverRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/server/$serverId",
  component: lazyRouteComponent(() => import("@/routes/server/$serverId/route"), "ServerLayout"),
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
  component: lazyRouteComponent(() => import("@/routes/server/$serverId/overview"), "OverviewPage"),
});

const consoleRoute = createRoute({
  getParentRoute: () => serverRoute,
  path: "/console",
  component: lazyRouteComponent(() => import("@/routes/server/$serverId/console"), "ConsolePage"),
});

const playersRoute = createRoute({
  getParentRoute: () => serverRoute,
  path: "/players",
  component: lazyRouteComponent(() => import("@/routes/server/$serverId/players"), "PlayersPage"),
});

const modsRoute = createRoute({
  getParentRoute: () => serverRoute,
  path: "/mods",
  component: lazyRouteComponent(() => import("@/routes/server/$serverId/mods"), "ModsPage"),
});

const filesRoute = createRoute({
  getParentRoute: () => serverRoute,
  path: "/files",
  component: lazyRouteComponent(() => import("@/routes/server/$serverId/files"), "FilesPage"),
});

const backupsRoute = createRoute({
  getParentRoute: () => serverRoute,
  path: "/backups",
  component: lazyRouteComponent(() => import("@/routes/server/$serverId/backups"), "BackupsPage"),
});

const playitRoute = createRoute({
  getParentRoute: () => serverRoute,
  path: "/playit",
  component: lazyRouteComponent(() => import("@/routes/server/$serverId/playit"), "PlayitPage"),
});

const propertiesRoute = createRoute({
  getParentRoute: () => serverRoute,
  path: "/properties",
  component: lazyRouteComponent(() => import("@/routes/server/$serverId/properties"), "PropertiesPage"),
});

const settingsRoute = createRoute({
  getParentRoute: () => serverRoute,
  path: "/settings",
  component: lazyRouteComponent(() => import("@/routes/server/$serverId/settings"), "SettingsPage"),
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
