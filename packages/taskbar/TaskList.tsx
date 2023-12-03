import * as React from "react";
import { minimizeWindow, raiseWindow } from "@electron-wm/renderer-shared";
import { useCallback } from "react";
import { IIconInfo, isUrgent, IWindow } from "@electron-wm/shared";
import { useIconInfoDataUri, useWindows } from "@electron-wm/plugin-utils";

export function TaskList() {
  const windows = useWindows({ currentScreenOnly: true, currentTagsOnly: true, visibleOnly: false });
  const entries = [];
  for (const win of windows) {
    entries.push(<TaskListEntry key={win.id} win={win} />);
  }
  return <div className="tasklist">{entries}</div>;
}

interface ITaskListEntryProps {
  win: IWindow;
}

function TaskListEntry(props: ITaskListEntryProps) {
  const { win } = props;

  let className = "tasklistentry";
  if (win.focused) {
    className += " focused";
  }
  if (isUrgent(win)) {
    className += " urgent";
  }

  const onClick = useCallback(() => {
    if (win.focused) minimizeWindow(win.id);
    else raiseWindow(win.id);
  }, [win]);

  const hasIcons = (win.icons?.length ?? 0) > 0;

  return (
    <div className={className} onClick={onClick} title={win.title}>
      {hasIcons && <TaskListEntryIcon icons={win.icons!} />}
      <span className="tasklistentrytext">{win.title}</span>
    </div>
  );
}

interface ITaskListEntryIconProps {
  icons: IIconInfo[];
}

function TaskListEntryIcon(props: ITaskListEntryIconProps) {
  const { icons } = props;

  const icon = icons[0]; // TODO: Pick "best" icon.
  const dataUri = useIconInfoDataUri(icon);

  // If there was no icon info, return null.
  // We expect dataUri to be absent the initial render; still render the img in preparation in this case.
  if (!icon) {
    return null;
  }

  return <img className="tasklistentryicon" src={dataUri} />;
}
