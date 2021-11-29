import { ipcRenderer } from "electron";
import { X11_KEY_MODIFIER } from "../shared/X";
import * as actions from "../shared/actions";

export function setupIpc(store: any) {
  (window as any).commands = {
    raiseWindow: function(wid: number) {
      ipcRenderer.send("raise-window", wid);
    },

    minimizeWindow: function(wid: number) {
      ipcRenderer.send("minimize-window", wid);
    },

    closeWindow: function(wid: number) {
      ipcRenderer.send("close-window", wid);
    },

    exec: function(executable: string, args: string) {
      ipcRenderer.send("exec", {
        executable,
        args
      });
    },
  };

  ipcRenderer.on("x-keypress", (event, args) => {
    console.log(args);
    if (args.buttons === X11_KEY_MODIFIER.Mod4Mask) {
      if (args.keycode === 27) {
        store.dispatch(actions.toggleTaskbarRunField(true));
      }
    }
  });
}
