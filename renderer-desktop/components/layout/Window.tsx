import * as React from "react";
import { useLayoutEffect, useRef } from "react";
import { useStore } from "react-redux";
import { IWindow } from "../../../shared/types";
import { geometriesDiffer } from "../../../shared/utils";
import { configureWindowAction } from "../../../shared/redux/windowSlice";

export interface IWindowProps {
  window: IWindow;
}

export function Window({ window }: IWindowProps) {
  const winEl = useRef<HTMLDivElement>();

  const store = useStore();

  const style = {
    width: "100%",
    height: "100%",
  };

  useLayoutEffect(() => {
    const clientRect = winEl.current?.getBoundingClientRect();

    if (window && clientRect) {
      if (geometriesDiffer(window.outer, clientRect)) {
        store.dispatch(configureWindowAction({
          wid: window.id,
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
