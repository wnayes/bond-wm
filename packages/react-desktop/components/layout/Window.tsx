import * as React from "react";
import { useLayoutEffect, useRef } from "react";
import { useStore } from "react-redux";
import {
  getWindowMaxHeight,
  getWindowMaxWidth,
  getWindowMinHeight,
  getWindowMinWidth,
  IWindow,
  IScreen,
  WindowPosition,
  LayoutPluginConfig,
} from "@electron-wm/shared";
import { geometriesDiffer } from "@electron-wm/shared";
import { configureWindowAction } from "@electron-wm/shared";
import { getBoundingClientRectWithZoom } from "@electron-wm/renderer-shared";

export interface IWindowProps {
  win: IWindow;
  screen: IScreen;
  layout: LayoutPluginConfig;
  fill?: boolean;
  floatRight?: boolean;
}

export function Window({ win, screen, layout, fill, floatRight }: IWindowProps) {
  const winElRef = useRef<HTMLDivElement>(null);

  const store = useStore();
  const workArea = screen.workArea;

  const maximizeSupported = layout.supportsMaximize;

  const style: React.CSSProperties = {};

  if (win.fullscreen) {
    style.position = "fixed";
    style.left = 0;
    style.top = 0;
    style.width = "100%";
    style.height = "100%";
  } else if (maximizeSupported && win.maximized) {
    style.width = "100%";
    style.height = "100%";
  } else {
    switch (win.position) {
      case WindowPosition.Default:
        if (fill) {
          style.width = "100%";
          style.height = "100%";
        } else {
          style.float = floatRight ? "right" : "left";
          style.width = adjustForZoom(win.outer.width);
          style.height = adjustForZoom(win.outer.height);
        }
        break;
      case WindowPosition.UserPositioned:
        style.position = "absolute";
        style.width = adjustForZoom(win.outer.width);
        style.height = adjustForZoom(win.outer.height);
        style.left = adjustForZoom(win.outer.x) - workArea.x;
        style.top = adjustForZoom(win.outer.y) - workArea.y;
        break;
    }

    const minWidth = getWindowMinWidth(win);
    if (minWidth > 0) {
      style.minWidth = minWidth + win.frameExtents.left + win.frameExtents.right;
    }

    const maxWidth = getWindowMaxWidth(win);
    if (Number.isFinite(maxWidth)) {
      style.maxWidth = maxWidth + win.frameExtents.left + win.frameExtents.right;
    }

    const minHeight = getWindowMinHeight(win);
    if (minHeight > 0) {
      style.minHeight = minHeight + win.frameExtents.top + win.frameExtents.bottom;
    }

    const maxHeight = getWindowMaxHeight(win);
    if (Number.isFinite(maxHeight)) {
      style.maxHeight = maxHeight + win.frameExtents.top + win.frameExtents.bottom;
    }
  }

  useLayoutEffect(() => {
    const winEl = winElRef?.current;
    if (!winEl || !win) {
      return;
    }

    const clientRect = getBoundingClientRectWithZoom(winEl);
    const finalRect = {
      x: clientRect.x,
      y: clientRect.y,
      width: clientRect.width,
      height: clientRect.height,
    };

    if (win.position !== WindowPosition.UserPositioned) {
      // Keep the windows within the screen.
      if (finalRect.x + finalRect.width > screen.width) {
        finalRect.x = screen.width - finalRect.width;
      }
      finalRect.x = Math.max(0, finalRect.x);

      if (finalRect.y + finalRect.height > screen.height) {
        finalRect.y = screen.height - finalRect.height;
      }
      finalRect.y = Math.max(0, finalRect.y);
    }

    if (geometriesDiffer(win.outer, finalRect)) {
      store.dispatch(
        configureWindowAction({
          wid: win.id,
          ...finalRect,
        })
      );
    }
  });

  return <div ref={winElRef} style={style}></div>;
}

function adjustForZoom(value: number): number {
  const zoomRatio = window.devicePixelRatio;
  if (zoomRatio !== 1) {
    return value / zoomRatio;
  }
  return value;
}
