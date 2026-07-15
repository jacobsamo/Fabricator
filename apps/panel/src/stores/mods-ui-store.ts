import { Store } from "@tanstack/store";

import { patchStore, useStoreSelector } from "@/stores/store-utils";

export type ModsDialogId = "mod-browser" | "modpack-browser" | "dependencies" | "compatibility" | "side-decisions" | null;

export type ModsUiStoreState = {
  searchText: string;
  selectedModFilenames: string[];
  activeDialog: ModsDialogId;
  pendingProjectId: string | null;
};

const initialState: ModsUiStoreState = {
  searchText: "",
  selectedModFilenames: [],
  activeDialog: null,
  pendingProjectId: null,
};

export const modsUiStore = new Store<ModsUiStoreState>(initialState);

export function useModsUiStore<TSelected>(selector: (state: ModsUiStoreState) => TSelected) {
  return useStoreSelector(modsUiStore, selector);
}

export const modsUiStoreActions = {
  setSearchText(searchText: string) {
    patchStore(modsUiStore, { searchText });
  },
  setActiveDialog(activeDialog: ModsDialogId) {
    patchStore(modsUiStore, { activeDialog });
  },
  setPendingProjectId(pendingProjectId: string | null) {
    patchStore(modsUiStore, { pendingProjectId });
  },
  setSelectedModFilenames(selectedModFilenames: string[]) {
    patchStore(modsUiStore, { selectedModFilenames });
  },
  toggleModSelection(filename: string) {
    modsUiStore.setState((state) => {
      const selected = new Set(state.selectedModFilenames);
      if (selected.has(filename)) {
        selected.delete(filename);
      } else {
        selected.add(filename);
      }
      return { ...state, selectedModFilenames: Array.from(selected) };
    });
  },
  clearSelection() {
    patchStore(modsUiStore, { selectedModFilenames: [] });
  },
  reset() {
    modsUiStore.setState(() => initialState);
  },
};
