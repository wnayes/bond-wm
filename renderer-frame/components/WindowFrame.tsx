import * as React from "react";
import { useLayoutEffect, useRef } from "react";
import { useSelector, useStore } from "react-redux";
import { RootState } from "../../renderer-shared/configureStore";
import { useWindowSize } from "../../renderer-shared/hooks";
import { setFrameExtentsAction } from "../../shared/redux/windowSlice";

import { TitleBar } from "./TitleBar";

interface IWindowFrameProps {
  wid: number;
}

/**
 * Component that renders a window frame around a client window.
 */
export function WindowFrame(props: IWindowFrameProps) {
  const { wid } = props;

  const rootDiv = useRef<HTMLDivElement>();
  const winBox = useRef<HTMLDivElement>();

  const store = useStore();
  const window = useSelector((state: RootState) => state.windows[wid]);

  let className = "winWrapper";
  if (window?.focused) {
    className += " focused";
  }

  let titlebar;
  if (window?.decorated) {
    titlebar = <TitleBar window={window} />;
  }

  useWindowSize(); // Triggers re-renders on resize.

  useLayoutEffect(() => {
    const box = winBox.current;
    if (!box) {
      return;
    }

    // eslint-disable-next-line prefer-const
    let { top, left, right, bottom } = box.getBoundingClientRect();

    const { right: bodyRight, bottom: bodyBottom } = document.body.getBoundingClientRect();
    right = bodyRight - right;
    bottom = bodyBottom - bottom;

    if (window) {
      if (
        window.inner.top !== top ||
        window.inner.left !== left ||
        window.inner.right !== right ||
        window.inner.bottom !== bottom
      ) {
        store.dispatch(setFrameExtentsAction({ wid, top, left, right, bottom }));
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
