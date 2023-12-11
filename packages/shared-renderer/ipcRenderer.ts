import { ipcRenderer } from "electron";
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
}

export function setOnCompletionOptionsResult(callback: CompletionOptionsCallback): void {
  _onCompletionOptionsResult = callback;
}
