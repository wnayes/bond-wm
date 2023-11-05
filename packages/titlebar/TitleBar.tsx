import * as React from "react";
import { useCallback } from "react";
import { useSelector } from "react-redux";
import { maximizeWindow, restoreWindow, showContextMenu, useLayoutPlugins } from "@electron-wm/renderer-shared";
import { RootState } from "@electron-wm/renderer-shared";
import { ContextMenuKind } from "@electron-wm/shared";
import { selectWindowMaximizeCanTakeEffect } from "@electron-wm/shared";
import { IWindow } from "@electron-wm/shared";
import { useWindow } from "@electron-wm/plugin-utils";

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

function useSupportsMaximize(win: IWindow | null): boolean {
  const layouts = useLayoutPlugins(win?.screenIndex);
  return useSelector((state: RootState) => {
    if (!win) {
      return false;
    }
    return selectWindowMaximizeCanTakeEffect(state, layouts, win.id);
  });
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
