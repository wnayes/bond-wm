import { IWindow } from "../shared/window";

/**
 * This is basically my personal customization.
 * Could this be a pluggable feature of the window manager some day?
 */
export function customizeWindow(win: Partial<IWindow>) {
  if (win.wmClass?.[0] === "xfreerdp") {
    win.screenIndex = 1;
    win.decorated = false;
    win.outer.x = 0;
    win.outer.y = 0;
  }
}
