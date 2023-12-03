import * as React from "react";
import { useCallback } from "react";
import { maximizeWindow, restoreWindow, showContextMenu } from "@electron-wm/renderer-shared";
import { ContextMenuKind } from "@electron-wm/shared";
import { IWindow } from "@electron-wm/shared";
import { useSupportsMaximize, useWindow } from "@electron-wm/plugin-utils";

interface ITitleBarProps extends React.PropsWithChildren<{}> {}

export function TitleBar({ children }: ITitleBarProps) {
  const win = useWindow();
  const onContextMenu = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    showContextMenu(ContextMenuKind.Frame);
  }, []);

  if (!win || !win.decorated || win.fullscreen) {
    return null;
  }

  return (
    <div className="winTitleBar" onContextMenu={onContextMenu}>
      {children}
    </div>
  );
}

export function useMaximizeHandler(win: IWindow | null) {
  const supportsMaximize = useSupportsMaximize(win);
  const onMaximizeClick = useCallback(() => {
    if (!win || !supportsMaximize) {
      return;
    }

    if (win.maximized) {
      restoreWindow(win.id);
    } else {
      maximizeWindow(win.id);
    }
  }, [win, supportsMaximize]);
  return onMaximizeClick;
}
