import { useMemo } from "react";
import { useHotkey } from "@tanstack/react-hotkeys";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { Archive, Boxes, FileText, Gauge, LayoutGrid, Network, Server, Settings, Terminal, Users } from "lucide-react";

import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
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
      <Command>
        <CommandInput placeholder="Command search" />
        <CommandList>
          <CommandEmpty>No commands found.</CommandEmpty>
          <CommandGroup>
            {commands.map((command) => (
              <CommandItem
                key={`${command.description}:${command.label}`}
                value={`${command.label} ${command.description}`}
                onSelect={() => {
                  appStoreActions.setCommandPaletteOpen(false);
                  void command.run();
                }}
              >
                <command.icon className="size-4 text-muted-foreground" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{command.label}</span>
                  <span className="block truncate text-xs text-muted-foreground">{command.description}</span>
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </Command>
    </Dialog>
  );
}
