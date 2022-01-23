import * as React from "react";

import { Clock } from "./Clock";
import { useDispatch, useSelector } from "react-redux";
import { minimizeWindow, raiseWindow } from "../../../renderer-shared/commands";
import { useCallback, useMemo } from "react";
import { RootState } from "../../../renderer-shared/configureStore";
import { IWindow } from "../../../shared/window";
import { selectWindowsFromScreen } from "../../../renderer-shared/selectors";
import { setScreenCurrentTagsAction } from "../../../shared/redux/screenSlice";
import { RunField } from "./RunField";
import { LayoutIndicator } from "./LayoutIndicator";

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

interface ITaskListProps {
  windows: IWindow[];
}

function TaskList(props: ITaskListProps) {
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

interface ITagListProps {
  screenIndex: number;
}

function TagList(props: ITagListProps) {
  const tags = useSelector<RootState>((state) => state.screens[props.screenIndex].tags) as string[];
  const currentTags = useSelector<RootState>((state) => state.screens[props.screenIndex].currentTags) as string[];

  const windows = useSelector((state: RootState) => selectWindowsFromScreen(state, props.screenIndex));
  const tagWindowMap = useMemo(() => {
    const map: { [tag: string]: boolean } = {};
    for (const win of windows) {
      for (const tag of win.tags) {
        map[tag] = true;
      }
    }
    return map;
  }, [windows]);

  const dispatch = useDispatch();

  const entries = tags.map((tag) => {
    return (
      <TagListEntry
        tag={tag}
        key={tag}
        selected={currentTags.indexOf(tag) >= 0}
        populated={!!tagWindowMap[tag]}
        onClick={() => {
          dispatch(setScreenCurrentTagsAction({ screenIndex: props.screenIndex, currentTags: [tag] }));
        }}
      />
    );
  });

  return <div className="taglist">{entries}</div>;
}

interface ITagListEntryProps {
  tag: string;
  selected: boolean;
  populated: boolean;
  onClick(): void;
}

function TagListEntry({ tag, selected, populated, onClick }: ITagListEntryProps) {
  let className = "taglistentry";
  if (selected) {
    className += " selected";
    onClick = undefined;
  }

  return (
    <div className={className} onClick={onClick}>
      {populated && <div className="taglistEntryBadge"></div>}
      {tag}
    </div>
  );
}
