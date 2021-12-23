import * as React from "react";
import { useLayoutEffect, useRef } from "react";
import { useStore } from "react-redux";
import { IWindow } from "../../../shared/reducers";
import * as actions from "../../../shared/actions";

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
        let { x, y, width, height } = box.getBoundingClientRect();

        if (window) {
          if (window.outer.x !== x
            || window.outer.y !== y
            || window.outer.width !== width
            || window.outer.height !== height) {
              store.dispatch(actions.configureWindow(window.id, { x, y, width, height }));
          }
        }
    });

    return <div ref={winEl} style={style}></div>;
}
