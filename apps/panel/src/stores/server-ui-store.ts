import { Store } from "@tanstack/store";

import { patchStore, useStoreSelector } from "@/stores/store-utils";

export type ServerActionId = "start" | "stop" | "restart" | "install" | "delete" | null;
export type ServerModalId = "create" | "delete" | "java-install" | "update-confirm" | null;

export type ServerUiStoreState = {
  selectedServerId: string | null;
  activeModal: ServerModalId;
  pendingAction: ServerActionId;
  consoleFilter: string;
  followConsole: boolean;
};

const initialState: ServerUiStoreState = {
  selectedServerId: null,
  activeModal: null,
  pendingAction: null,
  consoleFilter: "",
  followConsole: true,
};

export const serverUiStore = new Store<ServerUiStoreState>(initialState);

export function useServerUiStore<TSelected>(selector: (state: ServerUiStoreState) => TSelected) {
  return useStoreSelector(serverUiStore, selector);
}

export const serverUiStoreActions = {
  selectServer(selectedServerId: string | null) {
    patchStore(serverUiStore, { selectedServerId });
  },
  setActiveModal(activeModal: ServerModalId) {
    patchStore(serverUiStore, { activeModal });
  },
  setPendingAction(pendingAction: ServerActionId) {
    patchStore(serverUiStore, { pendingAction });
  },
  setConsoleFilter(consoleFilter: string) {
    patchStore(serverUiStore, { consoleFilter });
  },
  setFollowConsole(followConsole: boolean) {
    patchStore(serverUiStore, { followConsole });
  },
  reset() {
    serverUiStore.setState(() => initialState);
  },
};
