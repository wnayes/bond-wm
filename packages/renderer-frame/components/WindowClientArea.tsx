import * as React from "react";
import { useLayoutEffect, useRef } from "react";
import { useStore } from "react-redux";
import { setFrameExtentsAction } from "@electron-wm/shared";
import { getBoundingClientRectWithZoom } from "@electron-wm/renderer-shared";
import { useWindow } from "@electron-wm/plugin-utils";

/**
 * When this component renders, it reports its size as the client area for the window.
 */
export function WindowClientArea() {
  const win = useWindow();
  const winBox = useRef<HTMLDivElement>(null);
  const store = useStore();

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
        store.dispatch(setFrameExtentsAction({ wid: win.id, top, left, right, bottom }));
      }
    }
  });

  return <div className="winBox" ref={winBox}></div>;
}
