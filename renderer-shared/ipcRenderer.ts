import { ipcRenderer } from "electron";
import { X11_KEY_MODIFIER } from "../shared/X";
import * as actions from "../shared/actions";
import { Store } from "./configureStore";
import { focusDesktopBrowser } from "./commands";

export function setupIpc(store: Store, screenIndex: number) {
  ipcRenderer.on("x-keypress", (event, args) => {
    console.log(args);
    if (args.buttons === X11_KEY_MODIFIER.Mod4Mask) {
      if (args.keycode === 27) {
        // Mod4 + R
        store.dispatch(actions.toggleTaskbarRunField(true));

        focusDesktopBrowser(screenIndex);
      }
    }
  });
}
