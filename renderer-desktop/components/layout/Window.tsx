import * as React from "react";
import { useLayoutEffect, useRef } from "react";
import { useStore } from "react-redux";
import { IWindow } from "../../../shared/reducers";
import * as actions from "../../../shared/actions";
import { geometriesDiffer } from "../../../shared/utils";

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
    const box = winEl.current!;
    const clientRect = box.getBoundingClientRect();

    if (window) {
      if (geometriesDiffer(window.outer, clientRect)) {
        store.dispatch(actions.configureWindow(window.id, clientRect));
      }
    }
  });

  return <div ref={winEl} style={style}></div>;
}
