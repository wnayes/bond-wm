import { app, BrowserWindow, IpcMainEvent, Menu } from "electron";
import { ContextMenuKind } from "@bond-wm/shared";
import { log } from "./log";

export function showContextMenu(event: IpcMainEvent, kind: ContextMenuKind, version: string | undefined): void {
  log("Showing context menu (kind=" + ContextMenuKind[kind]);

  switch (kind) {
    case ContextMenuKind.Desktop:
      showDesktopMenu(event, version);
      break;

    case ContextMenuKind.Frame:
      showFrameMenu(event);
      break;
  }
}

function showDesktopMenu(event: IpcMainEvent, version: string | undefined) {
  const browserWindow = BrowserWindow.fromWebContents(event.sender);
  if (!browserWindow) {
    return;
  }

  const desktopMenu = Menu.buildFromTemplate([
    {
      label: "bond-wm" + (version ? ` — ${version}` : ""),
      enabled: false,
    },
    {
      type: "separator",
    },
    {
      label: "Reload Desktop",
      click: () => {
        browserWindow.reload();
      },
    },
    {
      label: "Desktop Developer Tools",
      click: () => {
        browserWindow.webContents.openDevTools();
      },
    },
    {
      label: "Quit",
      click: () => {
        app.quit();
      },
    },
  ]);

  desktopMenu.popup({
    window: browserWindow,
  });
}

function showFrameMenu(event: IpcMainEvent) {
  const browserWindow = BrowserWindow.fromWebContents(event.sender);
  if (!browserWindow) {
    return;
  }

  const frameMenu = Menu.buildFromTemplate([
    {
      label: "Reload Frame",
      click: () => {
        browserWindow.reload();
      },
    },
    {
      label: "Frame Developer Tools",
      click: () => {
        browserWindow.webContents.openDevTools({ mode: "detach" });
      },
    },
  ]);

  frameMenu.popup({
    window: browserWindow,
  });
}
