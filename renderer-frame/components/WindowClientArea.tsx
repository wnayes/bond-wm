import * as React from "react";
import { useLayoutEffect, useRef } from "react";
import { useSelector, useStore } from "react-redux";
import { RootState } from "../../renderer-shared/configureStore";
import { setFrameExtentsAction } from "../../shared/redux/windowSlice";
import { getBoundingClientRectWithZoom } from "../../renderer-shared/dom";

interface IWindowClientAreaProps {
  wid: number;
}

/**
 * When this component renders, it reports its size as the client area for the window.
 */
export function WindowClientArea(props: IWindowClientAreaProps) {
  const { wid } = props;

  const winBox = useRef<HTMLDivElement>(null);

  const store = useStore();
  const win = useSelector((state: RootState) => state.windows[wid]);

  useLayoutEffect(() => {
    const box = winBox.current;
    if (!box) {
      return;
    }

    // eslint-disable-next-line prefer-const
    let { top, left, right, bottom } = getBoundingClientRectWithZoom(box);

    const { right: bodyRight, bottom: bodyBottom } = getBoundingClientRectWithZoom(document.body);
    right = bodyRight - right;
    bottom = bodyBottom - bottom;

    if (win) {
      if (
        win.frameExtents.top !== top ||
        win.frameExtents.left !== left ||
        win.frameExtents.right !== right ||
        win.frameExtents.bottom !== bottom
      ) {
        store.dispatch(setFrameExtentsAction({ wid, top, left, right, bottom }));
      }
    }
  });

  return <div className="winBox" ref={winBox}></div>;
}
