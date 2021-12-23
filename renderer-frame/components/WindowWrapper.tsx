import * as React from "react";
import { useLayoutEffect, useRef } from "react";
import { useSelector, useStore } from "react-redux";
import { useWindowSize } from "../../renderer-shared/hooks";
import * as actions from "../../shared/actions";

import { TitleBar } from "./TitleBar";

interface IWindowWrapperProps {
  wid: number;
}

export function WindowWrapper(props: IWindowWrapperProps) {
  const { wid } = props;

  const rootDiv = useRef<HTMLDivElement>();
  const winBox = useRef<HTMLDivElement>();

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

  useWindowSize(); // Triggers re-renders on resize.

  useLayoutEffect(() => {
    const box = winBox.current!;
    let { top, left, right, bottom } = box.getBoundingClientRect();

    const { right: bodyRight, bottom: bodyBottom } = document.body.getBoundingClientRect();
    right = bodyRight - right;
    bottom = bodyBottom - bottom;

    if (window) {
      if (window.inner.top !== top
        || window.inner.left !== left
        || window.inner.right !== right
        || window.inner.bottom !== bottom) {
          store.dispatch(actions.configureInnerWindow(wid, { top, left, right, bottom }));
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