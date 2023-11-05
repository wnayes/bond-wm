import * as React from "react";
import { useCallback } from "react";
import { useSelector } from "react-redux";
import {
  closeWindow,
  maximizeWindow,
  minimizeWindow,
  restoreWindow,
  showContextMenu,
  useLayoutPlugins,
} from "@electron-wm/renderer-shared";
import { RootState } from "@electron-wm/renderer-shared";
import { useIconInfoDataUri } from "@electron-wm/renderer-shared";
import { ContextMenuKind } from "@electron-wm/shared";
import { selectWindowMaximizeCanTakeEffect } from "@electron-wm/shared";
import { IWindow } from "@electron-wm/shared";
import { useWindow } from "../hooks/useWindow";

interface ITitleBarProps extends React.PropsWithChildren<{}> {}

export function TitleBar({ children }: ITitleBarProps) {
  const win = useWindow();
  const onContextMenu = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    showContextMenu(ContextMenuKind.Frame);
  }, []);

  if (!win || win.decorated || win.fullscreen) {
    return null;
  }

  return (
    <div className="winTitleBar" onContextMenu={onContextMenu}>
      {children}
    </div>
  );
}

export function TitleBarIcon() {
  const win = useWindow();
  const icons = win?.icons;
  const icon = icons?.[0]; // TODO: Pick "best" icon.
  const dataUri = useIconInfoDataUri(icon);

  // If there was no icon info, return null.
  // We expect dataUri to be absent the initial render; still render the img in preparation in this case.
  if (!icon) {
    return null;
  }

  return <img className="winTitleBarIcon" src={dataUri} />;
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

function useMaximizeHandler(win: IWindow | null) {
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

export function TitleBarText() {
  const win = useWindow();
  const onMaximizeClick = useMaximizeHandler(win);

  if (!win) {
    return null;
  }

  // FIXME: The double click doesn't work due to -webkit-app-region: drag.
  return (
    <span className="winTitleBarText" onDoubleClick={onMaximizeClick}>
      {win.title}
    </span>
  );
}

export function TitleBarCloseButton() {
  const win = useWindow();
  const winId = win?.id;
  const onClick = useCallback(() => {
    if (typeof winId === "number") {
      closeWindow(winId);
    }
  }, [winId]);

  if (!win) {
    return null;
  }

  return (
    <div className="winTitleBarBtn winTitleBarCloseBtn" onClick={onClick} title="Close">
      <img className="winTitleBarBtnIcon" src="./assets/close.svg" />
    </div>
  );
}

export function TitleBarMaximizeButton() {
  const win = useWindow();
  const onClick = useMaximizeHandler(win);

  if (!win) {
    return null;
  }

  const graphic = win.maximized ? "./assets/restore.svg" : "./assets/maximize.svg";
  const tooltip = win.maximized ? "Restore" : "Maximize";

  return (
    <div className="winTitleBarBtn winTitleBarMaximizeBtn" onClick={onClick} title={tooltip}>
      <img className="winTitleBarBtnIcon" src={graphic} />
    </div>
  );
}

export function TitleBarMinimizeButton() {
  const win = useWindow();
  const winId = win?.id;
  const onClick = useCallback(() => {
    if (typeof winId === "number") {
      minimizeWindow(winId);
    }
  }, [winId]);

  if (!win) {
    return null;
  }

  return (
    <div className="winTitleBarBtn winTitleBarMinimizeBtn" onClick={onClick} title="Minimize">
      <img className="winTitleBarBtnIcon" src="./assets/minimize.svg" />
    </div>
  );
}
