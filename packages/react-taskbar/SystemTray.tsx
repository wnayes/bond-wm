import React, { useLayoutEffect, useRef } from "react";
import { useSelector, useStore } from "react-redux";
import { RootState, getBoundingClientRectWithZoom } from "@electron-wm/shared-renderer";
import { configureTrayWindowAction, ITrayEntry, geometriesDiffer } from "@electron-wm/shared";
import { useBrowserWindowSize } from "@electron-wm/react";

export function SystemTray() {
  useBrowserWindowSize(); // Triggers re-renders on resize.

  const trayWindows = useSelector((state: RootState) => state.tray.windows);
  if (!trayWindows) {
    return null;
  }

  const entries = [];
  for (const trayWinId in trayWindows) {
    const trayWin = trayWindows[trayWinId];
    entries.push(<SystemTrayIcon key={trayWin.id} win={trayWin} />);
  }
  return <div className="sysTray">{entries}</div>;
}

interface ISystemTrayIconProps {
  win: ITrayEntry;
}

function SystemTrayIcon(props: ISystemTrayIconProps) {
  const { win } = props;
  const iconBox = useRef<HTMLDivElement>(null);
  const store = useStore();

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
          ...finalRect,
        })
      );
    }
  });

  return <div ref={iconBox} className="sysTrayIcon"></div>;
}
