import { focusDesktopBrowser, sendRegisterDesktopShortcut, sendUnregisterDesktopShortcut } from "./commands";

export interface DesktopShortcutOpts {
  desktopTakesFocus?: boolean;
}

interface IDesktopShortcutContext {
  callback: VoidFunction;
  opts: DesktopShortcutOpts;
}

const _desktopShortcuts = new Map<string, IDesktopShortcutContext>();

export function registerDesktopShortcut(
  keyString: string,
  screenIndex: number,
  opts: DesktopShortcutOpts,
  callback: VoidFunction
): void {
  if (!_desktopShortcuts.has(keyString)) {
    _desktopShortcuts.set(keyString, { callback, opts });
    sendRegisterDesktopShortcut(keyString, screenIndex);
  }
}

export function unregisterDesktopShortcut(keyString: string, screenIndex: number): void {
  if (_desktopShortcuts.has(keyString)) {
    _desktopShortcuts.delete(keyString);
    sendUnregisterDesktopShortcut(keyString, screenIndex);
  }
}

export function invokeDesktopShortcutHandler(keyString: string, screenIndex: number): void {
  const context = _desktopShortcuts.get(keyString);
  if (context) {
    context.callback();

    if (context.opts.desktopTakesFocus) {
      focusDesktopBrowser({ screenIndex, takeVisualFocus: false });
    }
  }
}
