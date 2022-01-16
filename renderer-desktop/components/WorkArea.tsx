import * as React from "react";
import { useLayoutEffect, useRef } from "react";
import { useSelector, useStore } from "react-redux";
import { RootState } from "../../renderer-shared/configureStore";
import { Layout } from "./layout/Layout";
import { useWindowSize } from "../../renderer-shared/hooks";
import { Wallpaper } from "./Wallpaper";
import { IWindow } from "../../shared/types";
import { geometriesDiffer } from "../../shared/utils";
import { configureScreenWorkAreaAction } from "../../shared/redux/screenSlice";

export interface IWorkAreaProps {
  screenIndex: number;
  windows: IWindow[];
}

export function WorkArea({ screenIndex, windows }: IWorkAreaProps) {
  const workAreaDiv = useRef<HTMLDivElement>();

  const store = useStore();
  const screen = useSelector((state: RootState) => state.screens[screenIndex]);

  useWindowSize(); // To trigger size recalculations.

  useLayoutEffect(() => {
    const clientRect = workAreaDiv.current?.getBoundingClientRect();

    if (screen && clientRect) {
      if (geometriesDiffer(screen.workArea, clientRect)) {
        store.dispatch(configureScreenWorkAreaAction({
          screenIndex,
          x: clientRect.x,
          y: clientRect.y,
          width: clientRect.width,
          height: clientRect.height,
        }));
      }
    }
  });

  return (
    <div id="workarea" ref={workAreaDiv}>
      <Wallpaper />
      <Layout screen={screen} windows={windows} />
    </div>
  );
}
