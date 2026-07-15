import { Store } from "@tanstack/store";

import { patchStore, useStoreSelector } from "@/stores/store-utils";

export type HotkeyScope = "global" | "server" | "console" | "files" | "mods" | "backups" | "dialog";

export type HotkeyCommand = {
  id: string;
  scope: HotkeyScope;
  label: string;
  keys: string[];
};

export type HotkeysStoreState = {
  activeScopes: HotkeyScope[];
  commands: Record<string, HotkeyCommand>;
};

const initialState: HotkeysStoreState = {
  activeScopes: ["global"],
  commands: {},
};

export const hotkeysStore = new Store<HotkeysStoreState>(initialState);

export function useHotkeysStore<TSelected>(selector: (state: HotkeysStoreState) => TSelected) {
  return useStoreSelector(hotkeysStore, selector);
}

export const hotkeysStoreActions = {
  setActiveScopes(activeScopes: HotkeyScope[]) {
    patchStore(hotkeysStore, { activeScopes });
  },
  pushScope(scope: HotkeyScope) {
    hotkeysStore.setState((state) => ({
      ...state,
      activeScopes: state.activeScopes.includes(scope) ? state.activeScopes : [...state.activeScopes, scope],
    }));
  },
  removeScope(scope: HotkeyScope) {
    hotkeysStore.setState((state) => ({
      ...state,
      activeScopes: state.activeScopes.filter((activeScope) => activeScope !== scope),
    }));
  },
  registerCommand(command: HotkeyCommand) {
    hotkeysStore.setState((state) => ({
      ...state,
      commands: { ...state.commands, [command.id]: command },
    }));
  },
  unregisterCommand(commandId: string) {
    hotkeysStore.setState((state) => {
      const { [commandId]: _removed, ...commands } = state.commands;
      return { ...state, commands };
    });
  },
  reset() {
    hotkeysStore.setState(() => initialState);
  },
};
