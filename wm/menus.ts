import { app, BrowserWindow, IpcMainEvent, Menu } from "electron";
import { ContextMenuKind } from "../shared/ContextMenuKind";
import { log } from "./log";

export function showContextMenu(event: IpcMainEvent, kind: ContextMenuKind): void {
  log("Showing context menu (kind=" + ContextMenuKind[kind]);

  switch (kind) {
    case ContextMenuKind.General:
      showGenericMenu(event);
      break;
  }
}

const genericMenu = Menu.buildFromTemplate([
  {
    label: "Quit",
    click: () => {
      app.quit();
    },
  },
]);

function showGenericMenu(event: IpcMainEvent) {
  genericMenu.popup({
    window: BrowserWindow.fromWebContents(event.sender),
  });
}
