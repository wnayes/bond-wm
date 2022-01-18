import * as React from "react";
import { useLayoutEffect, useRef } from "react";
import { useStore } from "react-redux";
import { IWindow } from "../../../shared/types";
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
  }

  useLayoutEffect(() => {
    const clientRect = winEl.current?.getBoundingClientRect();

    if (win && clientRect) {
      if (geometriesDiffer(win.outer, clientRect)) {
        store.dispatch(configureWindowAction({
          wid: win.id,
          x: clientRect.x,
          y: clientRect.y,
          width: clientRect.width,
          height: clientRect.height,
        }));
      }
    }
  });

  return <div ref={winEl} style={style}></div>;
}
