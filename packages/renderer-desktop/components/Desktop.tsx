import * as React from "react";
import { useCallback } from "react";
import { ErrorBoundary } from "react-error-boundary";

import { useSelector } from "react-redux";
import { showContextMenu } from "../../renderer-shared/commands";
import { RootState } from "../../renderer-shared/configureStore";
import { selectVisibleWindowsFromCurrentTags, selectWindowsFromCurrentTags } from "../../shared/selectors";
import { ContextMenuKind } from "../../shared/ContextMenuKind";
import { ErrorDisplay } from "../../renderer-shared/components/ErrorDisplay";

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
