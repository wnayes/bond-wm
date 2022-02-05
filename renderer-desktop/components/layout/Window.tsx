import * as React from "react";
import { useLayoutEffect, useRef } from "react";
import { useStore } from "react-redux";
import {
  getWindowMaxHeight,
  getWindowMaxWidth,
  getWindowMinHeight,
  getWindowMinWidth,
  IWindow,
  WindowPosition,
} from "../../../shared/window";
import { geometriesDiffer } from "../../../shared/utils";
import { configureWindowAction } from "../../../shared/redux/windowSlice";
import { IScreen } from "../../../shared/types";

export interface IWindowProps {
  win: IWindow;
  screen: IScreen;
  fill?: boolean;
}

export function Window({ win, fill }: IWindowProps) {
  const winEl = useRef<HTMLDivElement>();

  const store = useStore();

  const style: React.CSSProperties = {};

  if (win.fullscreen) {
    style.position = "fixed";
    style.left = 0;
    style.top = 0;
    style.width = "100%";
    style.height = "100%";
  } else {
    switch (win.position) {
      case WindowPosition.Default:
        if (fill) {
          style.width = "100%";
          style.height = "100%";
        } else {
          style.float = "left";
          style.width = win.outer.width;
          style.height = win.outer.height;
        }
        break;
      case WindowPosition.UserPositioned:
        style.position = "absolute";
        style.width = win.outer.width;
        style.height = win.outer.height;
        style.left = win.outer.x;
        style.top = win.outer.y;
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
    const clientRect = winEl.current?.getBoundingClientRect();

    if (win && clientRect) {
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
    }
  });

  return <div ref={winEl} style={style}></div>;
}
