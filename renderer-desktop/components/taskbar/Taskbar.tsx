import * as React from "react";

import { Clock } from "./Clock";
import { useSelector } from "react-redux";
import { RootState } from "../../../renderer-shared/configureStore";
import { IWindow } from "../../../shared/window";
import { RunField } from "./RunField";
import { LayoutIndicator } from "./LayoutIndicator";
import { TagList } from "./TagList";
import { TaskList } from "./TaskList";

interface ITaskbarProps {
  screenIndex: number;
  windows: IWindow[];
}

export function Taskbar(props: ITaskbarProps) {
  const windows = props.windows;

  const showingRun = useSelector<RootState>((state) => state.taskbar.showingRun);

  return (
    <div className="taskbar">
      <TagList screenIndex={props.screenIndex} />
      {showingRun && <RunField />}
      <TaskList windows={windows} />
      <Clock />
      <LayoutIndicator screenIndex={props.screenIndex} />
    </div>
  );
}
