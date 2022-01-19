import * as React from "react";
import { useLayoutEffect, useRef } from "react";
import { useStore } from "react-redux";
import {
  getWindowMaxHeight,
  getWindowMaxWidth,
  getWindowMinHeight,
  getWindowMinWidth,
  IWindow,
} from "../../../shared/window";
import { geometriesDiffer } from "../../../shared/utils";
import { configureWindowAction } from "../../../shared/redux/windowSlice";

export interface IWindowProps {
  win: IWindow;
}

export function Window({ win }: IWindowProps) {
  const winEl = useRef<HTMLDivElement>();

  const store = useStore();

  const style: React.CSSProperties = {
    width: "100%",
    height: "100%",
  };
  if (win.fullscreen) {
    style.position = "fixed";
    style.left = 0;
    style.top = 0;
  } else {
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
      if (geometriesDiffer(win.outer, clientRect)) {
        store.dispatch(
          configureWindowAction({
            wid: win.id,
            x: clientRect.x,
            y: clientRect.y,
            width: clientRect.width,
            height: clientRect.height,
          })
        );
      }
    }
  });

  return <div ref={winEl} style={style}></div>;
}
