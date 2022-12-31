import * as React from "react";
import { useCallback } from "react";
import { ErrorBoundary } from "react-error-boundary";

import { useSelector } from "react-redux";
import { showContextMenu } from "@electron-wm/renderer-shared";
import { RootState } from "@electron-wm/renderer-shared";
import { selectVisibleWindowsFromCurrentTags, selectWindowsFromCurrentTags } from "@electron-wm/shared";
import { ContextMenuKind } from "@electron-wm/shared";
import { ErrorDisplay } from "@electron-wm/renderer-shared";

import { Taskbar } from "./taskbar/Taskbar";
import { WorkArea } from "./WorkArea";

export interface IDesktopProps {
  screenIndex: number;
}

export function Desktop({ screenIndex }: IDesktopProps) {
  const windows = useSelector((state: RootState) => selectWindowsFromCurrentTags(state, screenIndex));
  const visibleWindows = useSelector((state: RootState) => selectVisibleWindowsFromCurrentTags(state, screenIndex));

  const onContextMenu = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    showContextMenu(ContextMenuKind.Desktop);
  }, []);

  return (
    <div id="desktop" onContextMenu={onContextMenu}>
      <Taskbar screenIndex={screenIndex} windows={windows} />
      <ErrorBoundary FallbackComponent={ErrorDisplay}>
        <WorkArea screenIndex={screenIndex} windows={visibleWindows} />
      </ErrorBoundary>
    </div>
  );
}
