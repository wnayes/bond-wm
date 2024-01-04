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
    ipcRenderer.send("raise-window", wid);
  },

  minimizeWindow(wid: number): void {
    ipcRenderer.send("minimize-window", wid);
  },

  maximizeWindow(wid: number): void {
    ipcRenderer.send("maximize-window", wid);
  },

  restoreWindow(wid: number): void {
    ipcRenderer.send("restore-window", wid);
  },

  closeWindow(wid: number): void {
    ipcRenderer.send("close-window", wid);
  },

  focusDesktopBrowser({ screenIndex, takeVisualFocus }: { screenIndex: number; takeVisualFocus?: boolean }): void {
    ipcRenderer.send("focus-desktop-browser", { screenIndex, takeVisualFocus });
  },

  frameWindowMouseEnter(wid: number): void {
    ipcRenderer.send("frame-window-mouse-enter", wid);
  },

  desktopZoomIn(screenIndex: number): void {
    ipcRenderer.send("desktop-zoom-in", { screenIndex });
  },

  desktopZoomOut(screenIndex: number): void {
    ipcRenderer.send("desktop-zoom-out", { screenIndex });
  },

  desktopZoomReset(screenIndex: number): void {
    ipcRenderer.send("desktop-zoom-reset", { screenIndex });
  },

  exec(executable: string, args?: string): void {
    ipcRenderer.send("exec", { executable, args });
  },

  executeDesktopEntry(entryName: string): void {
    ipcRenderer.send("exec-desktop-entry", { entryName });
  },

  showDevTools(screenIndex: number): void {
    ipcRenderer.send("show-desktop-dev-tools", { screenIndex });
  },

  showContextMenu(menuKind: ContextMenuKind): void {
    ipcRenderer.send("show-context-menu", { menuKind });
  },

  sendRegisterDesktopShortcut(keyString: string, screenIndex: number): void {
    ipcRenderer.send("register-desktop-shortcut", { keyString, screenIndex });
  },

  sendUnregisterDesktopShortcut(keyString: string, screenIndex: number): void {
    ipcRenderer.send("unregister-desktop-shortcut", { keyString, screenIndex });
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
