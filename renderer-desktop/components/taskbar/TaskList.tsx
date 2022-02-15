import * as React from "react";

import { minimizeWindow, raiseWindow } from "../../../renderer-shared/commands";
import { useCallback } from "react";
import { IWindow } from "../../../shared/window";

interface ITaskListProps {
  windows: IWindow[];
}

export function TaskList(props: ITaskListProps) {
  const windows = props.windows;
  const entries = [];
  for (const win of windows) {
    entries.push(<TaskListEntry key={win.id} window={win} />);
  }
  return <div className="tasklist">{entries}</div>;
}

interface ITaskListEntryProps {
  window: IWindow;
}

function TaskListEntry(props: ITaskListEntryProps) {
  const win = props.window;

  let className = "tasklistentry";
  if (win.focused) className += " focused";

  const onClick = useCallback(() => {
    if (win.focused) minimizeWindow(win.id);
    else raiseWindow(win.id);
  }, [win]);

  return (
    <div className={className} onClick={onClick} title={win.title}>
      {win.title}
    </div>
  );
}
