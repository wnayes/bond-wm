import { preload } from "@wnayes/electron-redux/preload";

// Importing the preload module automatically executes it.
// We need to somehow reference the module though, else esbuild wants to elide it.
// (This re-export is suitable for now, could be fragile if esbuild tree shakes harder in the future.)
export { preload };

import { contextBridge, ipcRenderer } from "electron";
import type {
  ContextMenuKind,
  ElectronWMIPCInterface,
  CompletionOptionsCallback,
  ISetupIPCCallbacks,
  INotification,
} from "@bond-wm/shared";
import { IPCMessages } from "@bond-wm/shared";

let _onCompletionOptionsResult: CompletionOptionsCallback | undefined;
let _onNotificationNew: ((notification: INotification) => void) | undefined;
let _onNotificationClose: ((id: number) => void) | undefined;

const electronWmApi: ElectronWMIPCInterface = {
  raiseWindow(wid: number): void {
    ipcRenderer.send(IPCMessages.RaiseWindow, wid);
  },

  minimizeWindow(wid: number): void {
    ipcRenderer.send(IPCMessages.MinimizeWindow, wid);
  },

  maximizeWindow(wid: number): void {
    ipcRenderer.send(IPCMessages.MaximizeWindow, wid);
  },

  restoreWindow(wid: number): void {
    ipcRenderer.send(IPCMessages.RestoreWindow, wid);
  },

  closeWindow(wid: number): void {
    ipcRenderer.send(IPCMessages.CloseWindow, wid);
  },

  focusDesktopBrowser({ screenIndex, takeVisualFocus }: { screenIndex: number; takeVisualFocus?: boolean }): void {
    ipcRenderer.send(IPCMessages.FocusDesktopBrowser, { screenIndex, takeVisualFocus });
  },

  frameWindowMouseEnter(wid: number): void {
    ipcRenderer.send(IPCMessages.FrameWindowMouseEnter, wid);
  },

  desktopZoomIn(screenIndex: number): void {
    ipcRenderer.send(IPCMessages.DesktopZoomIn, { screenIndex });
  },

  desktopZoomOut(screenIndex: number): void {
    ipcRenderer.send(IPCMessages.DesktopZoomOut, { screenIndex });
  },

  desktopZoomReset(screenIndex: number): void {
    ipcRenderer.send(IPCMessages.DesktopZoomReset, { screenIndex });
  },

  executeDesktopEntry(entryName: string): void {
    ipcRenderer.send(IPCMessages.ExecDesktopEntry, { entryName });
  },

  showDevTools(screenIndex: number): void {
    ipcRenderer.send(IPCMessages.ShowDesktopDevTools, { screenIndex });
  },

  showContextMenu(menuKind: ContextMenuKind): void {
    ipcRenderer.send(IPCMessages.ShowContextMenu, { menuKind });
  },

  sendRegisterDesktopShortcut(keyString: string, screenIndex: number): void {
    ipcRenderer.send(IPCMessages.RegisterDesktopShortcut, { keyString, screenIndex });
  },

  sendUnregisterDesktopShortcut(keyString: string, screenIndex: number): void {
    ipcRenderer.send(IPCMessages.UnregisterDesktopShortcut, { keyString, screenIndex });
  },

  setupIpc(callbacks: ISetupIPCCallbacks) {
    ipcRenderer.on("x-keypress", (event, args) => {
      console.log("x-keypress", args);
      callbacks.onInvokeDesktopShortcutHandler(args.keyString);
    });

    ipcRenderer.on("completion-options-result", (event, options: string[]) => {
      _onCompletionOptionsResult?.(options);
      _onCompletionOptionsResult = undefined;
    });
  },

  getCompletionOptionsInit() {
    ipcRenderer.send(IPCMessages.GetCompletionOptions);
  },

  setOnCompletionOptionsResult(callback: CompletionOptionsCallback): void {
    _onCompletionOptionsResult = callback;
  },

  registerFrameWidListener(callback: (wid: number) => void): void {
    ipcRenderer.on(IPCMessages.SetFrameWid, (event, newWid: number) => {
      callback(newWid);
    });
  },

  // Métodos de notificação
  async closeNotification(id: number): Promise<void> {
    return ipcRenderer.invoke("notification:close", id);
  },

  async invokeNotificationAction(id: number, action: string): Promise<void> {
    return ipcRenderer.invoke("notification:action", id, action);
  },

  async getActiveNotifications(): Promise<INotification[]> {
    return ipcRenderer.invoke("notification:getActive");
  },

  onNotificationNew(callback: (notification: INotification) => void): void {
    _onNotificationNew = callback;
    ipcRenderer.on("notification:new", (event, notification: INotification) => {
      _onNotificationNew?.(notification);
    });
  },

  onNotificationClose(callback: (id: number) => void): void {
    _onNotificationClose = callback;
    ipcRenderer.on("notification:close", (event, id: number) => {
      _onNotificationClose?.(id);
    });
  },

  removeNotificationListeners(): void {
    ipcRenderer.removeAllListeners("notification:new");
    ipcRenderer.removeAllListeners("notification:close");
    _onNotificationNew = undefined;
    _onNotificationClose = undefined;
  },
};

// Expose electron API for authentication and other features
const electronApi = {
  ipcRenderer: {
    on: (channel: string, listener: (...args: any[]) => void) => {
      ipcRenderer.on(channel, listener);
    },
    off: (channel: string, listener: (...args: any[]) => void) => {
      ipcRenderer.off(channel, listener);
    },
    invoke: (channel: string, ...args: any[]) => {
      return ipcRenderer.invoke(channel, ...args);
    },
  },
};

contextBridge.exposeInMainWorld("ElectronWM", electronWmApi);
contextBridge.exposeInMainWorld("electron", electronApi);
