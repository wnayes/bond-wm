import { DesktopShortcutOpts, registerDesktopShortcut, unregisterDesktopShortcut } from "@bond-wm/shared-renderer";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { useScreenIndex } from "./useScreenIndex";

/**
 * Registers a shortcut handler that fires when the cursor is over the current desktop.
 * @param keyString X11 key string.
 * @param opts Shortcut registration options
 * @param callback Callback to raise.
 */
export function useDesktopShortcut(keyString: string, opts: DesktopShortcutOpts, callback: VoidFunction): void {
  // Trying to not excessively register/unregister...
  const callbackRef = useRef<VoidFunction>();
  callbackRef.current = callback;

  const registeredCallback = useCallback(() => {
    callbackRef.current?.();
  }, []);

  const optsMemo = useMemo(() => {
    return {
      desktopTakesFocus: opts.desktopTakesFocus,
    };
  }, [opts.desktopTakesFocus]);

  const screenIndex = useScreenIndex();

  useEffect(() => {
    registerDesktopShortcut(keyString, screenIndex, optsMemo, registeredCallback);
    return () => {
      unregisterDesktopShortcut(keyString, screenIndex);
    };
  }, [keyString, screenIndex, optsMemo, registeredCallback]);
}
