import * as React from "react";
import { ReactNode, useCallback, useLayoutEffect, useRef } from "react";
import { useSelector, useStore } from "react-redux";
import { RootState, getBoundingClientRectWithZoom } from "@bond-wm/shared-renderer";
import { useBrowserWindowSize } from "../useBrowserWindowSize";
import { useScreenIndex } from "../useScreenIndex";
import { geometriesDiffer } from "@bond-wm/shared";
import { configureScreenWorkAreaAction } from "@bond-wm/shared";
import { focusDesktopBrowser } from "@bond-wm/shared-renderer";
import { useTheme } from "../theming";

export interface IWorkAreaProps {
  children?: ReactNode;
}

export function WorkArea({ children }: IWorkAreaProps) {
  const workAreaDiv = useRef<HTMLDivElement>(null);

  const store = useStore();
  const screenIndex = useScreenIndex();
  const screen = useSelector((state: RootState) => state.screens[screenIndex]);

  useBrowserWindowSize(); // To trigger size recalculations.

  useLayoutEffect(() => {
    const clientRect = workAreaDiv.current && getBoundingClientRectWithZoom(workAreaDiv.current);

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

  const theme = useTheme();

  return (
    <div
      id="workarea"
      ref={workAreaDiv}
      onClickCapture={onWorkAreaClick}
      style={{
        backgroundColor: theme.desktop?.workareaColor ?? "#EEEEEE",
      }}
    >
      {children}
    </div>
  );
}
