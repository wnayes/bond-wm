import * as React from "react";

import { useSelector } from "react-redux";
import { RootState } from "../../renderer-shared/configureStore";

import { Taskbar } from "./Taskbar";
import { WorkArea } from "./WorkArea";

export interface IDesktopProps {
  screenIndex: number;
}

export function Desktop({ screenIndex }: IDesktopProps) {
  // TODO: Windows should only be ones from the current screen.
  const windows = useSelector((state: RootState) => state.windows);

  return (
    <div id="desktop">
      <Taskbar windows={windows} />
      <WorkArea screenIndex={screenIndex} />
    </div>
  );
}
