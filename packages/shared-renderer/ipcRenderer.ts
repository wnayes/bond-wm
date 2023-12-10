import { ipcRenderer } from "electron";
import { setupNPMPackageProxyListeners } from "@electron-wm/shared";
import { Store } from "./configureStore";
import { invokeDesktopShortcutHandler } from "./shortcuts";

type CompletionOptionsCallback = (options: string[]) => void;
let _onCompletionOptionsResult: CompletionOptionsCallback | undefined;

export function setupIpc(store: Store, screenIndex: number) {
  ipcRenderer.on("x-keypress", (event, args) => {
    console.log("x-keypress", args);
    invokeDesktopShortcutHandler(args.keyString, screenIndex);
  });

  ipcRenderer.on("completion-options-result", (event, options: string[]) => {
    _onCompletionOptionsResult?.(options);
    _onCompletionOptionsResult = undefined;
  });

  setupNPMPackageProxyListeners(ipcRenderer);
}

export function setOnCompletionOptionsResult(callback: CompletionOptionsCallback): void {
  _onCompletionOptionsResult = callback;
}
