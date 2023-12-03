import { ipcRenderer } from "electron";
import { ContextMenuKind } from "../shared/ContextMenuKind";
import { setOnCompletionOptionsResult } from "./ipcRenderer";

export function raiseWindow(wid: number) {
  ipcRenderer.send("raise-window", wid);
}

export function minimizeWindow(wid: number) {
  ipcRenderer.send("minimize-window", wid);
}

export function maximizeWindow(wid: number) {
  ipcRenderer.send("maximize-window", wid);
}

export function restoreWindow(wid: number) {
  ipcRenderer.send("restore-window", wid);
}

export function closeWindow(wid: number) {
  ipcRenderer.send("close-window", wid);
}

export function focusDesktopBrowser({
  screenIndex,
  takeVisualFocus,
}: {
  screenIndex: number;
  takeVisualFocus?: boolean;
}): void {
  ipcRenderer.send("focus-desktop-browser", { screenIndex, takeVisualFocus });
}

export function frameWindowMouseEnter(wid: number) {
  ipcRenderer.send("frame-window-mouse-enter", wid);
}

export function desktopZoomIn(screenIndex: number): void {
  ipcRenderer.send("desktop-zoom-in", { screenIndex });
}

export function desktopZoomOut(screenIndex: number): void {
  ipcRenderer.send("desktop-zoom-out", { screenIndex });
}

export function desktopZoomReset(screenIndex: number): void {
  ipcRenderer.send("desktop-zoom-reset", { screenIndex });
}

export function exec(executable: string, args?: string) {
  ipcRenderer.send("exec", { executable, args });
}

export function showDevTools(screenIndex: number): void {
  ipcRenderer.send("show-desktop-dev-tools", { screenIndex });
}

export function showContextMenu(menuKind: ContextMenuKind): void {
  ipcRenderer.send("show-context-menu", { menuKind });
}

let _completionOptionsPromise: Promise<string[]> | undefined;

export function getCompletionOptions(): Promise<string[]> {
  if (!_completionOptionsPromise) {
    _completionOptionsPromise = new Promise((resolve) => {
      setOnCompletionOptionsResult((options) => {
        _completionOptionsPromise = undefined;
        resolve(options);
      });

      ipcRenderer.send("completion-options-get");
    });
  }

  return _completionOptionsPromise;
}
