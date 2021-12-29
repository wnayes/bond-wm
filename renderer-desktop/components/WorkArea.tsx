import * as React from "react";
import { useLayoutEffect, useRef } from "react";
import { useSelector, useStore } from "react-redux";
import * as actions from "../../shared/actions";
import { RootState } from "../../renderer-shared/configureStore";
import { Layout } from "./layout/Layout";
import { useWindowSize } from "../../renderer-shared/hooks";
import { Wallpaper } from "./Wallpaper";
import { IWindow } from "../../shared/reducers";

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
    let { x, y, width, height } = box.getBoundingClientRect();

    if (screen) {
      if (screen.workArea.x !== x
        || screen.workArea.y !== y
        || screen.workArea.width !== width
        || screen.workArea.height !== height) {
          store.dispatch(actions.configureScreenWorkArea(screenIndex, { x, y, width, height }));
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
