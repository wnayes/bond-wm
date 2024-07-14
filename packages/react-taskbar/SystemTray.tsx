import React, { useEffect, useLayoutEffect, useRef } from "react";
import { useDispatch, useSelector, useStore } from "react-redux";
import { RootState, getBoundingClientRectWithZoom } from "@bond-wm/shared-renderer";
import {
  configureTrayWindowAction,
  ITrayEntry,
  geometriesDiffer,
  CSSColorStringToRGBAArray,
  RGBAArray,
  arraysEqual,
  setTrayBackgroundColorAction,
} from "@bond-wm/shared";
import { useBrowserWindowSize, useScreenIndex } from "@bond-wm/react";

export function SystemTray() {
  const sysTrayDivRef = useRef<HTMLDivElement>(null);

  useBrowserWindowSize(); // Triggers re-renders on resize.

  const dispatch = useDispatch();
  const trayBgColor = useSelector((state: RootState) => state.tray.backgroundColor);

  // Determine the tray's background color and send it to the server.
  // Part of the workaround for tray icon transparency.
  useEffect(() => {
    if (sysTrayDivRef.current) {
      let el: HTMLElement | null | undefined = sysTrayDivRef.current;
      let bgColorArr: RGBAArray | undefined;
      while (el) {
        const computedStyle = getComputedStyle(el);
        const bgColor = computedStyle.backgroundColor;
        bgColorArr = CSSColorStringToRGBAArray(bgColor);
        if (!bgColor || bgColorArr[3] === 0) {
          bgColorArr = undefined;
          el = el.parentElement;
        } else {
          break;
        }
      }
      if (bgColorArr && !arraysEqual(trayBgColor, bgColorArr)) {
        dispatch(setTrayBackgroundColorAction(bgColorArr));
      }
    }
  });

  const trayWindows = useSelector((state: RootState) => state.tray.windows);
  if (!trayWindows) {
    return null;
  }

  const entries = [];
  for (const trayWinId in trayWindows) {
    const trayWin = trayWindows[trayWinId];
    entries.push(<SystemTrayIcon key={trayWin.id} win={trayWin} />);
  }
  return (
    <div ref={sysTrayDivRef} className="sysTray">
      {entries}
    </div>
  );
}

interface ISystemTrayIconProps {
  win: ITrayEntry;
}

function SystemTrayIcon(props: ISystemTrayIconProps) {
  const { win } = props;
  const iconBox = useRef<HTMLDivElement>(null);
  const store = useStore();
  const screenIndex = useScreenIndex();

  useLayoutEffect(() => {
    const box = iconBox.current;
    if (!box) {
      return;
    }

    const clientRect = getBoundingClientRectWithZoom(box);
    const finalRect = {
      x: clientRect.x + 1,
      y: clientRect.y,
      width: clientRect.width,
      height: clientRect.height,
    };

    if (geometriesDiffer(win.location, finalRect)) {
      store.dispatch(
        configureTrayWindowAction({
          wid: win.id,
          screenIndex,
          ...finalRect,
        })
      );
    }
  });

  return <div ref={iconBox} className="sysTrayIcon"></div>;
}
