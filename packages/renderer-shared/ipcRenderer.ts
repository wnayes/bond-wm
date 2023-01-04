import { ipcRenderer } from "electron";
import { setupNPMPackageProxyListeners, X11_KEY_MODIFIER } from "@electron-wm/shared";
import { Store } from "./configureStore";
import { focusDesktopBrowser } from "./commands";
import { showRunFieldAction } from "./redux/taskbarSlice";

type CompletionOptionsCallback = (options: string[]) => void;
let _onCompletionOptionsResult: CompletionOptionsCallback | undefined;

export function setupIpc(store: Store, screenIndex: number) {
  ipcRenderer.on("x-keypress", (event, args) => {
    console.log(args);
    if (args.buttons === X11_KEY_MODIFIER.Mod4Mask) {
      if (args.keycode === 27) {
        // Mod4 + R
        store.dispatch(showRunFieldAction(true));

        focusDesktopBrowser({ screenIndex, takeVisualFocus: false });
      }
    }
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
