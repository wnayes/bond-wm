import { IWindow, WindowPosition } from "@bond-wm/shared";

/**
 * This is basically my personal customization.
 * Could this be a pluggable feature of the window manager some day?
 */
export function customizeWindow(win: IWindow): void {
  if (win.wmClass?.[0] === "xfreerdp") {
    win.screenIndex = 1;
    win.position = WindowPosition.UserPositioned;
    win.decorated = false;
    win.borderWidth = 0;
    win.outer.x = 0;
    win.outer.y = 0;
  }
}
