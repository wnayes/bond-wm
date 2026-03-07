import React from "react";
import { ISize } from "@bond-wm/shared";
import { setChildWindowPosition } from "@bond-wm/shared-renderer";
import { FC, ReactNode, useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";
import { DomWindowContext } from "../useDomWindow";
import { useScreenIndex } from "../useScreenIndex";
import styles from "./ChildWindowStyles.css?url";
import { Stylesheet } from "./Stylesheet";
import { useTheme } from "../theming";

type ChildWindowPositionMode = "absolute" | "screen-relative";

function createChildWindowId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `fallback-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export interface IChildWindowProps {
  alwaysOnTop?: boolean;
  autoFocus?: boolean;
  children?: ReactNode;
  position: { x: number; y: number };
  size: ISize;
  positionMode?: ChildWindowPositionMode;
}

/**
 * Component that renders a separate floating window.
 */
export const ChildWindow: FC<IChildWindowProps> = ({
  alwaysOnTop,
  autoFocus,
  children,
  position,
  size,
  positionMode = "absolute",
}) => {
  const [win, setWin] = useState<Window | null>(null);
  const [childWindowId] = useState(createChildWindowId);
  const screenIndex = useScreenIndex();

  const [initialProps] = useState({ alwaysOnTop, position, size, autoFocus });
  if (initialProps.alwaysOnTop !== alwaysOnTop) {
    console.error("ChildWindow alwaysOnTop cannot be changed");
  }

  useLayoutEffect(() => {
    const features = [
      "BondWmChildWindow=true",
      `BondWmChildWindowId=${childWindowId}`,
      `width=${initialProps.size.width}`,
      `height=${initialProps.size.height}`,
      `left=-10000`,
      `top=-10000`,
      `alwaysOnTop=${initialProps.alwaysOnTop}`,
    ].join(",");
    const w = window.open("about:blank", "_blank", features);
    setWin(w);
    return () => w?.close();
  }, [initialProps, childWindowId]);

  useLayoutEffect(() => {
    if (win && initialProps.autoFocus) {
      win.focus();
    }
  }, [win, initialProps.autoFocus]);

  const { x, y } = position;
  useLayoutEffect(() => {
    if (win) {
      setChildWindowPosition({
        childWindowId,
        x,
        y,
        relativeToScreen: positionMode === "screen-relative",
        screenIndex,
      });
    }
  }, [win, childWindowId, x, y, positionMode, screenIndex]);

  useLayoutEffect(() => {
    win?.resizeTo(size.width, size.height);
  }, [win, size.width, size.height]);

  const theme = useTheme();
  useLayoutEffect(() => {
    if (win && theme) {
      const rootStyles = win.document.documentElement.style;
      rootStyles.setProperty("--window-font-family", theme.fontFamily);
    }
  }, [win, theme]);

  if (!win) return null;
  return (
    <DomWindowContext.Provider value={win}>
      <Stylesheet href={styles} />
      {createPortal(children, win.document.body)}
    </DomWindowContext.Provider>
  );
};
