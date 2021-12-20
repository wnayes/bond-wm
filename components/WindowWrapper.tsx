import * as React from "react";
import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import * as ReactDOM from "react-dom";
import { useSelector, useStore } from "react-redux";
import * as actions from "../shared/actions";

import { TitleBar } from "./TitleBar";

interface IWindowWrapperProps {
  wid: number;
}

export function WindowWrapper(props: IWindowWrapperProps) {
  const { wid } = props;

  const rootDiv = useRef<HTMLDivElement>();
  const winBox = useRef<HTMLDivElement>();
  const __leftAdjust = useRef<number | undefined>(undefined);
  const __topAdjust = useRef<number | undefined>(undefined);

  const store = useStore();
  const window = useSelector((state: any) => state.windows[wid]);

  let className = "winWrapper";
  if (window?.focused) {
    className += " focused";
  }

  let titlebar;
  if (window?.decorated) {
    titlebar = (
      <TitleBar window={window} />
    );
  }

  useLayoutEffect(() => {
    const box = winBox.current!;
    const { x, y, width, height } = box.getBoundingClientRect();

    if (window) {
      if (window.inner.x !== x
        || window.inner.y !== y
        || window.inner.width !== width
        || window.inner.height !== height) {
          store.dispatch(actions.configureInnerWindow(wid, {
            x,
            y,
            width,
            height,
          }));
      }
    }
  });

  return (
    <div className={className} ref={rootDiv}>
      {titlebar}
      <div className="winBox" ref={winBox}></div>
    </div>
  );
}

module.exports = WindowWrapper;