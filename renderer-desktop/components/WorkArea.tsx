import * as React from "react";
import { useLayoutEffect, useRef } from "react";
import { useSelector, useStore } from "react-redux";
import * as actions from "../../shared/actions";
import { RootState } from "../../renderer-shared/configureStore";
import { Layout } from "./layout/Layout";
import { useWindowSize } from "../../renderer-shared/hooks";
import { Wallpaper } from "./Wallpaper";

export interface IWorkAreaProps {
    screenIndex: number;
  }

export function WorkArea({ screenIndex }: IWorkAreaProps) {
  const workAreaDiv = useRef<HTMLDivElement>();

  const store = useStore();
  const screen = useSelector((state: RootState) => state.screens[screenIndex]);

  // TODO: windows should be scoped to the current screen.
  const windows = Object.values(useSelector((state: RootState) => state.windows));

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
