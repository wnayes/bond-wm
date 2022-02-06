import { SharedRootState } from "../shared/redux/basicStore";
import { IWindow, WindowPosition } from "../shared/window";

/**
 * This is basically my personal customization.
 * Could this be a pluggable feature of the window manager some day?
 */
export function customizeWindow(win: Partial<IWindow>, state: SharedRootState) {
  if (win.wmClass?.[0] === "xfreerdp") {
    const screen = state.screens[1];
    win.screenIndex = 1;
    win.position = WindowPosition.UserPositioned;
    win.decorated = false;
    win.borderWidth = 0;
    win.outer.x = screen.x;
    win.outer.y = screen.y;
  }
}
