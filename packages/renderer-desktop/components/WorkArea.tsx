import * as React from "react";
import { useCallback, useLayoutEffect, useRef } from "react";
import { useSelector, useStore } from "react-redux";
import { RootState } from "@electron-wm/renderer-shared";
import { Layout } from "./layout/Layout";
import { useBrowserWindowSize } from "@electron-wm/plugin-utils";
import Wallpaper from "@electron-wm/wallpaper";
import { Dimmer } from "./Dimmer";
import { IWindow } from "@electron-wm/shared";
import { geometriesDiffer } from "@electron-wm/shared";
import { configureScreenWorkAreaAction } from "@electron-wm/shared";
import { focusDesktopBrowser } from "@electron-wm/renderer-shared";

export interface IWorkAreaProps {
  screenIndex: number;
  windows: IWindow[];
}

export function WorkArea({ screenIndex, windows }: IWorkAreaProps) {
  const workAreaDiv = useRef<HTMLDivElement>(null);

  const store = useStore();
  const screen = useSelector((state: RootState) => state.screens[screenIndex]);

  useBrowserWindowSize(); // To trigger size recalculations.

  useLayoutEffect(() => {
    const clientRect = workAreaDiv.current?.getBoundingClientRect();

    if (screen && clientRect) {
      if (geometriesDiffer(screen.workArea, clientRect)) {
        store.dispatch(
          configureScreenWorkAreaAction({
            screenIndex,
            x: clientRect.x,
            y: clientRect.y,
            width: clientRect.width,
            height: clientRect.height,
          })
        );
      }
    }
  });

  const onWorkAreaClick = useCallback(() => {
    focusDesktopBrowser({ screenIndex, takeVisualFocus: true });
  }, [screenIndex]);

  return (
    <div id="workarea" ref={workAreaDiv} onClickCapture={onWorkAreaClick}>
      <Wallpaper />
      <Dimmer />
      <Layout screen={screen} windows={windows} />
    </div>
  );
}
