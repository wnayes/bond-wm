import { desktopZoomIn, desktopZoomOut, desktopZoomReset, showDevTools } from "@electron-wm/renderer-shared";
import { getScreenIndex } from "./utils";

export function hookShortcuts(el: HTMLElement): void {
  el.addEventListener("keydown", onKeydown);
}

function onKeydown(e: KeyboardEvent): void {
  // No modifier + ...
  if (!e.ctrlKey && !e.altKey && !e.shiftKey) {
    switch (e.key) {
      case "F12":
        showDevTools(getScreenIndex());
        break;
    }
  }

  // Ctrl + ...
  if (e.ctrlKey && !e.altKey && !e.shiftKey) {
    switch (e.key) {
      case "=": // + sign
        desktopZoomIn(getScreenIndex());
        break;

      case "-":
        desktopZoomOut(getScreenIndex());
        break;

      case "0":
        desktopZoomReset(getScreenIndex());
        break;
    }
  }
}
