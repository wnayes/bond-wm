import * as React from "react";
import { useLayoutEffect, useRef } from "react";
import { useSelector, useStore } from "react-redux";
import * as actions from "../../shared/actions";
import { RootState } from "../../renderer-shared/configureStore";
import { Layout } from "./layout/Layout";
import { useWindowSize } from "../../renderer-shared/hooks";
import { Wallpaper } from "./Wallpaper";
import { IWindow } from "../../shared/reducers";
import { geometriesDiffer } from "../../shared/utils";

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
    const box = workAreaDiv.current!;
    const clientRect = box.getBoundingClientRect();

    if (screen) {
      if (geometriesDiffer(screen.workArea, clientRect)) {
        store.dispatch(actions.configureScreenWorkArea(screenIndex, clientRect));
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
