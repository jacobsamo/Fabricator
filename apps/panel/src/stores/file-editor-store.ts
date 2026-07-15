import { Store } from "@tanstack/store";

import { patchStore, useStoreSelector } from "@/stores/store-utils";

export type OpenFileRef = {
  serverId: string;
  path: string;
};

export type FileEditorStoreState = {
  path: string | null;
  openFile: OpenFileRef | null;
  content: string;
  originalContent: string;
  discardPromptOpen: boolean;
};

const initialState: FileEditorStoreState = {
  path: null,
  openFile: null,
  content: "",
  originalContent: "",
  discardPromptOpen: false,
};

export const fileEditorStore = new Store<FileEditorStoreState>(initialState);

export function useFileEditorStore<TSelected>(selector: (state: FileEditorStoreState) => TSelected) {
  return useStoreSelector(fileEditorStore, selector);
}

export function isFileEditorDirty(state = fileEditorStore.state) {
  return state.content !== state.originalContent;
}

export const fileEditorStoreActions = {
  openFile(openFile: OpenFileRef, content: string) {
    fileEditorStore.setState(() => ({ path: openFile.path, openFile, content, originalContent: content, discardPromptOpen: false }));
  },
  setContent(content: string) {
    patchStore(fileEditorStore, { content });
  },
  markSaved(content = fileEditorStore.state.content) {
    patchStore(fileEditorStore, { content, originalContent: content, discardPromptOpen: false });
  },
  setDiscardPromptOpen(discardPromptOpen: boolean) {
    patchStore(fileEditorStore, { discardPromptOpen });
  },
  closeFile() {
    fileEditorStore.setState(() => initialState);
  },
};

export function openEditor(path: string, content: string) {
  fileEditorStore.setState(() => ({ path, openFile: { serverId: "", path }, content, originalContent: content, discardPromptOpen: false }));
}

export function updateEditorContent(content: string) {
  fileEditorStoreActions.setContent(content);
}

export function markEditorSaved(content: string) {
  fileEditorStoreActions.markSaved(content);
}

export function closeEditor() {
  fileEditorStoreActions.closeFile();
}
