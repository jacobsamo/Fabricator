import { Store } from "@tanstack/store";

import { patchStore, useStoreSelector } from "@/stores/store-utils";

export type BackupDialogId = "manage-configs" | "quick-backup" | "restore" | "delete-config" | "delete-snapshot" | "import-world" | null;

export type BackupsUiStoreState = {
  activeDialog: BackupDialogId;
  selectedConfigId: string | null;
  selectedSnapshotId: string | null;
  uploadProgress: number | null;
  activeJobId: string | null;
};

const initialState: BackupsUiStoreState = {
  activeDialog: null,
  selectedConfigId: null,
  selectedSnapshotId: null,
  uploadProgress: null,
  activeJobId: null,
};

export const backupsUiStore = new Store<BackupsUiStoreState>(initialState);

export function useBackupsUiStore<TSelected>(selector: (state: BackupsUiStoreState) => TSelected) {
  return useStoreSelector(backupsUiStore, selector);
}

export const backupsUiStoreActions = {
  setActiveDialog(activeDialog: BackupDialogId) {
    patchStore(backupsUiStore, { activeDialog });
  },
  selectConfig(selectedConfigId: string | null) {
    patchStore(backupsUiStore, { selectedConfigId });
  },
  selectSnapshot(selectedSnapshotId: string | null) {
    patchStore(backupsUiStore, { selectedSnapshotId });
  },
  setUploadProgress(uploadProgress: number | null) {
    patchStore(backupsUiStore, { uploadProgress });
  },
  setActiveJobId(activeJobId: string | null) {
    patchStore(backupsUiStore, { activeJobId });
  },
  reset() {
    backupsUiStore.setState(() => initialState);
  },
};
