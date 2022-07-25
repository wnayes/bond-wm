import * as React from "react";

import { Clock } from "./Clock";
import { useSelector } from "react-redux";
import { RootState } from "../../../renderer-shared/configureStore";
import { IWindow } from "../../../shared/window";
import { RunField } from "./RunField";
import { LayoutIndicator } from "./LayoutIndicator";
import { TagList } from "./TagList";
import { TaskList } from "./TaskList";
import { SystemTray } from "./SystemTray";

interface ITaskbarProps {
  screenIndex: number;
  windows: IWindow[];
}

export function Taskbar(props: ITaskbarProps) {
  const windows = props.windows;

  const showingRun = useSelector((state: RootState) => state.taskbar.showingRun);

  const showSystemTray = props.screenIndex === 0; // TODO: Configurable
  const trayWindows = useSelector((state: RootState) => (showSystemTray ? state.tray.windows : null));

  return (
    <div className="taskbar">
      <>
        <TagList screenIndex={props.screenIndex} />
        {showingRun && <RunField />}
        <TaskList windows={windows} />
        {showSystemTray && <SystemTray trayWindows={trayWindows} />}
        <Clock />
        <LayoutIndicator screenIndex={props.screenIndex} />
      </>
    </div>
  );
}
