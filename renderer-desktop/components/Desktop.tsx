import * as React from "react";
import { useCallback } from "react";

import { useSelector } from "react-redux";
import { showContextMenu } from "../../renderer-shared/commands";
import { RootState } from "../../renderer-shared/configureStore";
import { selectRelevantVisibleWindows, selectRelevantWindows } from "../../renderer-shared/selectors";
import { ContextMenuKind } from "../../shared/ContextMenuKind";

import { Taskbar } from "./taskbar/Taskbar";
import { WorkArea } from "./WorkArea";

export interface IDesktopProps {
  screenIndex: number;
}

export function Desktop({ screenIndex }: IDesktopProps) {
  const windows = useSelector((state: RootState) => selectRelevantWindows(state, screenIndex));
  const visibleWindows = useSelector((state: RootState) => selectRelevantVisibleWindows(state, screenIndex));

  const onContextMenu = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    showContextMenu(ContextMenuKind.General);
  }, []);

  return (
    <div id="desktop" onContextMenu={onContextMenu}>
      <Taskbar screenIndex={screenIndex} windows={windows} />
      <WorkArea screenIndex={screenIndex} windows={visibleWindows} />
    </div>
  );
}
