import { Store } from "@tanstack/store";

import { useStoreSelector } from "@/stores/store-utils";

export type GlobalModalId = "create-server" | "change-password" | null;

export type AppStoreState = {
  commandPaletteOpen: boolean;
  sidebarCollapsed: boolean;
  globalModal: GlobalModalId;
};

type AppStoreActions = {
  setCommandPaletteOpen: (commandPaletteOpen: boolean) => void;
  toggleCommandPalette: () => void;
  setSidebarCollapsed: (sidebarCollapsed: boolean) => void;
  setGlobalModal: (globalModal: GlobalModalId) => void;
  reset: () => void;
};

const initialState: AppStoreState = {
  commandPaletteOpen: false,
  sidebarCollapsed: false,
  globalModal: null,
};

export const appStore = new Store<AppStoreState, AppStoreActions>(initialState, ({ setState }) => ({
  setCommandPaletteOpen(commandPaletteOpen) {
    setState((state) => ({ ...state, commandPaletteOpen }));
  },
  toggleCommandPalette() {
    setState((state) => ({ ...state, commandPaletteOpen: !state.commandPaletteOpen }));
  },
  setSidebarCollapsed(sidebarCollapsed) {
    setState((state) => ({ ...state, sidebarCollapsed }));
  },
  setGlobalModal(globalModal) {
    setState((state) => ({ ...state, globalModal }));
  },
  reset() {
    setState(() => initialState);
  },
}));

export function useAppStore<TSelected>(selector: (state: AppStoreState) => TSelected) {
  return useStoreSelector(appStore, selector);
}

export const appStoreActions = {
  setCommandPaletteOpen(commandPaletteOpen: boolean) {
    appStore.actions.setCommandPaletteOpen(commandPaletteOpen);
  },
  toggleCommandPalette() {
    appStore.actions.toggleCommandPalette();
  },
  setSidebarCollapsed(sidebarCollapsed: boolean) {
    appStore.actions.setSidebarCollapsed(sidebarCollapsed);
  },
  setGlobalModal(globalModal: GlobalModalId) {
    appStore.actions.setGlobalModal(globalModal);
  },
  reset() {
    appStore.actions.reset();
  },
};
