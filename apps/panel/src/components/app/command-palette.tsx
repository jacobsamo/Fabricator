import { useMemo } from "react";
import { useHotkey } from "@tanstack/react-hotkeys";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { Archive, Boxes, FileText, Gauge, LayoutGrid, Network, Search, Server, Settings, Terminal, Users } from "lucide-react";

import { Dialog } from "@/components/ui/dialog";
import { serversQuery } from "@/queries/servers";
import { appStoreActions, useAppStore } from "@/stores/app-store";

const routeCommands = [
  { label: "Overview", path: "overview", icon: LayoutGrid },
  { label: "Console", path: "console", icon: Terminal },
  { label: "Players", path: "players", icon: Users },
  { label: "Mods", path: "mods", icon: Boxes },
  { label: "Files", path: "files", icon: FileText },
  { label: "Backups", path: "backups", icon: Archive },
  { label: "playit.gg", path: "playit", icon: Network },
  { label: "Properties", path: "properties", icon: Gauge },
  { label: "Settings", path: "settings", icon: Settings },
] as const;

export function CommandPalette() {
  const open = useAppStore((state) => state.commandPaletteOpen);
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const servers = useQuery(serversQuery);
  const segments = pathname.split("/").filter(Boolean);
  const currentServerId = segments[0] === "server" ? segments[1] : null;

  useHotkey("Mod+K", (event) => {
    event.preventDefault();
    appStoreActions.toggleCommandPalette();
  });

  const commands = useMemo(() => {
    const items: Array<{
      label: string;
      description: string;
      icon: typeof Server;
      run: () => void | Promise<void>;
    }> = [
      {
        label: "All servers",
        description: "Go to the server list",
        icon: Server,
        run: () => navigate({ to: "/" }),
      },
    ];

    if (currentServerId) {
      for (const command of routeCommands) {
        items.push({
          label: command.label,
          description: "Open current server route",
          icon: command.icon,
          run: () =>
            navigate({
              to: `/server/$serverId/${command.path}`,
              params: { serverId: currentServerId },
            }),
        });
      }
    }

    for (const server of servers.data || []) {
      items.push({
        label: server.name,
        description: "Switch server",
        icon: Server,
        run: () => navigate({ to: "/server/$serverId/overview", params: { serverId: server.id } }),
      });
    }

    return items;
  }, [currentServerId, navigate, servers.data]);

  return (
    <Dialog open={open} title="Command palette" onOpenChange={(nextOpen) => appStoreActions.setCommandPaletteOpen(nextOpen)} className="max-w-xl">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3 text-muted-foreground">
        <Search className="size-4" />
        <span className="text-sm">Command search</span>
        <kbd className="ml-auto rounded border border-border bg-muted px-1.5 py-0.5 text-[10px]">⌘K</kbd>
      </div>
      <div className="max-h-[50vh] overflow-y-auto p-2">
        {commands.map((command) => (
          <button
            type="button"
            key={`${command.description}:${command.label}`}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition hover:bg-accent hover:text-accent-foreground"
            onClick={() => {
              appStoreActions.setCommandPaletteOpen(false);
              void command.run();
            }}
          >
            <command.icon className="size-4 text-muted-foreground" />
            <span className="min-w-0 flex-1">
              <span className="block truncate font-medium">{command.label}</span>
              <span className="block truncate text-xs text-muted-foreground">{command.description}</span>
            </span>
          </button>
        ))}
      </div>
    </Dialog>
  );
}
