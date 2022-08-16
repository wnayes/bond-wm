import * as React from "react";
import { useCallback, useLayoutEffect, useRef } from "react";
import { useSelector, useStore } from "react-redux";
import { RootState } from "../../renderer-shared/configureStore";
import { Layout } from "./layout/Layout";
import { useWindowSize } from "../../renderer-shared/hooks";
import { Wallpaper } from "./Wallpaper";
import { Dimmer } from "./Dimmer";
import { IWindow } from "../../shared/window";
import { geometriesDiffer } from "../../shared/utils";
import { configureScreenWorkAreaAction } from "../../shared/redux/screenSlice";
import { focusDesktopBrowser } from "../../renderer-shared/commands";

export interface IWorkAreaProps {
  screenIndex: number;
  windows: IWindow[];
}

export function WorkArea({ screenIndex, windows }: IWorkAreaProps) {
  const workAreaDiv = useRef<HTMLDivElement>(null);

  const store = useStore();
  const screen = useSelector((state: RootState) => state.screens[screenIndex]);

  useWindowSize(); // To trigger size recalculations.

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
