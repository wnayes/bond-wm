import { ContextMenuKind, ElectronWMIPCInterface, ISetupIPCCallbacks } from "@electron-wm/shared";

declare global {
  interface Window {
    ElectronWM: ElectronWMIPCInterface;
  }
}

export function raiseWindow(wid: number) {
  window.ElectronWM.raiseWindow(wid);
}

export function minimizeWindow(wid: number) {
  window.ElectronWM.minimizeWindow(wid);
}

export function maximizeWindow(wid: number) {
  window.ElectronWM.maximizeWindow(wid);
}

export function restoreWindow(wid: number) {
  window.ElectronWM.restoreWindow(wid);
}

export function closeWindow(wid: number) {
  window.ElectronWM.closeWindow(wid);
}

export function focusDesktopBrowser({
  screenIndex,
  takeVisualFocus,
}: {
  screenIndex: number;
  takeVisualFocus?: boolean;
}): void {
  window.ElectronWM.focusDesktopBrowser({ screenIndex, takeVisualFocus });
}

export function frameWindowMouseEnter(wid: number) {
  window.ElectronWM.frameWindowMouseEnter(wid);
}

export function desktopZoomIn(screenIndex: number): void {
  window.ElectronWM.desktopZoomIn(screenIndex);
}

export function desktopZoomOut(screenIndex: number): void {
  window.ElectronWM.desktopZoomOut(screenIndex);
}

export function desktopZoomReset(screenIndex: number): void {
  window.ElectronWM.desktopZoomReset(screenIndex);
}

export function exec(executable: string, args?: string): void {
  window.ElectronWM.exec(executable, args);
}

export function executeDesktopEntry(entryName: string): void {
  window.ElectronWM.executeDesktopEntry(entryName);
}

export function showDevTools(screenIndex: number): void {
  window.ElectronWM.showDevTools(screenIndex);
}

export function showContextMenu(menuKind: ContextMenuKind): void {
  window.ElectronWM.showContextMenu(menuKind);
}

export function sendRegisterDesktopShortcut(keyString: string, screenIndex: number): void {
  window.ElectronWM.sendRegisterDesktopShortcut(keyString, screenIndex);
}

export function sendUnregisterDesktopShortcut(keyString: string, screenIndex: number): void {
  window.ElectronWM.sendUnregisterDesktopShortcut(keyString, screenIndex);
}

export function setupIpc(callbacks: ISetupIPCCallbacks): void {
  window.ElectronWM.setupIpc(callbacks);
}

let _completionOptionsPromise: Promise<string[]> | undefined;

export function getCompletionOptions(): Promise<string[]> {
  if (!_completionOptionsPromise) {
    _completionOptionsPromise = new Promise((resolve) => {
      window.ElectronWM.setOnCompletionOptionsResult((options) => {
        _completionOptionsPromise = undefined;
        resolve(options);
      });

      window.ElectronWM.getCompletionOptionsInit();
    });
  }

  return _completionOptionsPromise;
}

export function registerFrameWidListener(callback: (newWid: number) => void): void {
  window.ElectronWM.registerFrameWidListener(callback);
}
