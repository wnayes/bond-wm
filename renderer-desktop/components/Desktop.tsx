import * as React from "react";

import { useSelector } from "react-redux";
import { selectRelevantWindows } from "../../renderer-shared/selectors";

import { Taskbar } from "./Taskbar";
import { WorkArea } from "./WorkArea";

export interface IDesktopProps {
  screenIndex: number;
}

export function Desktop({ screenIndex }: IDesktopProps) {
  const windows = useSelector(selectRelevantWindows);

  return (
    <div id="desktop">
      <Taskbar screenIndex={screenIndex} windows={windows} />
      <WorkArea screenIndex={screenIndex} windows={windows} />
    </div>
  );
}
