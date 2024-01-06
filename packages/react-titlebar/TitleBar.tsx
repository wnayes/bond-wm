import * as React from "react";
import { useCallback } from "react";
import { maximizeWindow, restoreWindow, showContextMenu } from "@bond-wm/shared-renderer";
import { ContextMenuKind } from "@bond-wm/shared";
import { IWindow } from "@bond-wm/shared";
import { Stylesheet, useSupportsMaximize, useTheme, useWindow } from "@bond-wm/react";
import styles from "./TitleBar.css";

const DefaultHeight = 20;

interface ITitleBarProps extends React.PropsWithChildren<{}> {
  height?: number;
}

interface TitleBarStyle extends React.CSSProperties {
  "--window-titlebar-text-color": string;
  "--window-titlebar-close-bg-color": string;
  "--window-titlebar-close-hover-bg-color": string;
  "--window-titlebar-minimize-bg-color": string;
  "--window-titlebar-minimize-hover-bg-color": string;
  "--window-titlebar-maximize-bg-color": string;
  "--window-titlebar-maximize-hover-bg-color": string;
}

export function TitleBar({ children, height }: ITitleBarProps) {
  const win = useWindow();
  const onContextMenu = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    showContextMenu(ContextMenuKind.Frame);
  }, []);
  const theme = useTheme();

  if (!win || !win.decorated || win.fullscreen) {
    return null;
  }

  const style: TitleBarStyle = {
    height: height ?? DefaultHeight,

    "--window-titlebar-text-color": theme.window?.titlebar?.textColor ?? theme.window?.foreColor ?? "white",
    "--window-titlebar-close-bg-color":
      theme.window?.titlebar?.closeButtonColor ?? theme.window?.titlebar?.buttonColor ?? "transparent",
    "--window-titlebar-close-hover-bg-color":
      theme.window?.titlebar?.closeButtonHoverColor ?? theme.window?.titlebar?.buttonHoverColor ?? "transparent",
    "--window-titlebar-minimize-bg-color":
      theme.window?.titlebar?.minimizeButtonColor ?? theme.window?.titlebar?.buttonColor ?? "transparent",
    "--window-titlebar-minimize-hover-bg-color":
      theme.window?.titlebar?.minimizeButtonHoverColor ?? theme.window?.titlebar?.buttonHoverColor ?? "transparent",
    "--window-titlebar-maximize-bg-color":
      theme.window?.titlebar?.maximizeButtonColor ?? theme.window?.titlebar?.buttonColor ?? "transparent",
    "--window-titlebar-maximize-hover-bg-color":
      theme.window?.titlebar?.maximizeButtonHoverColor ?? theme.window?.titlebar?.buttonHoverColor ?? "transparent",
  };

  return (
    <>
      <Stylesheet href={styles} />
      <div className="winTitleBar" style={style} onContextMenu={onContextMenu}>
        {children}
      </div>
    </>
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
