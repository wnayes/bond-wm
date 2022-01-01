import * as React from "react";

import { Clock } from "./Clock";
import { useDispatch, useSelector } from "react-redux";
import * as actions from "../../shared/actions";
import { exec, minimizeWindow, raiseWindow } from "../../renderer-shared/commands";
import { useCallback, useEffect, useRef, useState } from "react";
import { RootState } from "../../renderer-shared/configureStore";
import { IWindow } from "../../shared/reducers";

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
    <div className={className} onClick={onClick}>
      {win.title}
    </div>
  );
}

function RunField() {
  const field = useRef<HTMLInputElement>();

  const [text, setText] = useState("");

  const dispatch = useDispatch();

  const reset = () => {
    setText("");
    dispatch(actions.toggleTaskbarRunField(false));
  };

  const onChange: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    setText(event.target.value);
  };

  const onKeyPress = (event: React.KeyboardEvent) => {
    if (text && event.key === "Enter") {
      exec(text);
      reset();
      event.preventDefault();
    }
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.keyCode === 27 /*esc*/) {
      reset();
    }
  };

  const onBlur = () => {
    reset();
  };

  useEffect(() => {
    field.current?.focus();
  }, []);

  return (
    <input
      type="text"
      value={text}
      className="taskbarRunField"
      ref={field}
      onChange={onChange}
      onKeyPress={onKeyPress}
      onKeyDown={onKeyDown}
      onBlur={onBlur}
    />
  );
}

interface ITagListProps {
  screenIndex: number;
}

function TagList(props: ITagListProps) {
  const tags = useSelector<RootState>((state) => state.screens[props.screenIndex].tags) as string[];
  const currentTags = useSelector<RootState>((state) => state.screens[props.screenIndex].currentTags) as string[];

  const dispatch = useDispatch();

  const entries = tags.map((tag) => {
    return (
      <TagListEntry
        tag={tag}
        key={tag}
        selected={currentTags.indexOf(tag) >= 0}
        onClick={() => {
          dispatch(actions.setScreenCurrentTags(props.screenIndex, [tag]));
        }}
      />
    );
  });

  return <div className="taglist">{entries}</div>;
}

interface ITagListEntryProps {
  tag: string;
  selected: boolean;
  onClick(): void;
}

function TagListEntry({ tag, selected, onClick }: ITagListEntryProps) {
  let className = "taglistentry";
  if (selected) {
    className += " selected";
    onClick = undefined;
  }

  return (
    <div className={className} onClick={onClick}>
      {tag}
    </div>
  );
}
