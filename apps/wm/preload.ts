import { preload } from "electron-redux/preload";

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
} from "@electron-wm/shared";
import { IPCMessages } from "@electron-wm/shared";

let _onCompletionOptionsResult: CompletionOptionsCallback | undefined;

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
};
contextBridge.exposeInMainWorld("ElectronWM", electronWmApi);
