import { describe, expect, it } from "vitest";

import { appStore, appStoreActions } from "@/stores/app-store";
import { backupsUiStore, backupsUiStoreActions } from "@/stores/backups-ui-store";
import { fileEditorStoreActions, isFileEditorDirty } from "@/stores/file-editor-store";
import { hotkeysStore, hotkeysStoreActions } from "@/stores/hotkeys-store";
import { modsUiStore, modsUiStoreActions } from "@/stores/mods-ui-store";
import { serverUiStore, serverUiStoreActions } from "@/stores/server-ui-store";

describe("TanStack UI stores", () => {
  it("keeps app chrome state client-only and resettable", () => {
    appStoreActions.setCommandPaletteOpen(true);
    appStoreActions.setSidebarCollapsed(true);
    appStoreActions.setGlobalModal("create-server");

    expect(appStore.state).toMatchObject({
      commandPaletteOpen: true,
      sidebarCollapsed: true,
      globalModal: "create-server",
    });

    appStoreActions.reset();
    expect(appStore.state).toMatchObject({
      commandPaletteOpen: false,
      sidebarCollapsed: false,
      globalModal: null,
    });
  });

  it("tracks file editor dirty state without server data", () => {
    fileEditorStoreActions.openFile({ serverId: "alpha", path: "server.properties" }, "motd=Fabricator");
    expect(isFileEditorDirty()).toBe(false);

    fileEditorStoreActions.setContent("motd=Changed");
    expect(isFileEditorDirty()).toBe(true);

    fileEditorStoreActions.markSaved();
    expect(isFileEditorDirty()).toBe(false);
    fileEditorStoreActions.closeFile();
  });

  it("keeps feature UI selections separate from server-owned records", () => {
    serverUiStoreActions.selectServer("alpha");
    serverUiStoreActions.setPendingAction("restart");
    modsUiStoreActions.toggleModSelection("fabric-api.jar");
    backupsUiStoreActions.selectSnapshot("snapshot-1");
    hotkeysStoreActions.pushScope("files");

    expect(serverUiStore.state.pendingAction).toBe("restart");
    expect(modsUiStore.state.selectedModFilenames).toEqual(["fabric-api.jar"]);
    expect(backupsUiStore.state.selectedSnapshotId).toBe("snapshot-1");
    expect(hotkeysStore.state.activeScopes).toContain("files");

    serverUiStoreActions.reset();
    modsUiStoreActions.reset();
    backupsUiStoreActions.reset();
    hotkeysStoreActions.reset();
  });
});
