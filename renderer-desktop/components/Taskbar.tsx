import * as React from "react";

import { Clock } from "./Clock";
import { connect } from "react-redux";
import * as actions from "../../shared/actions";

interface ITaskbarProps {
  windows: any[];
  showingRun: boolean;
}

class TaskbarComp extends React.Component<any> {
  render() {
    const windows = this.props.windows;

    let runField;
    if (this.props.showingRun) {
      runField = (
        <RunField />
      );
    }

    return (
      <div className="taskbar">
        {runField}
        <TaskList windows={windows} />
        <Clock />
      </div>
    );
  }
}

interface ITaskListProps {
  windows: any[];
}

class TaskList extends React.Component<ITaskListProps> {
  render() {
    const windows = this.props.windows;
    const entries = [];
    for (let wid in windows) {
      const window = windows[wid];

      entries.push(
        <TaskListEntry key={wid} window={window} />
      );
    }
    return (
      <div className="tasklist">
        {entries}
      </div>
    );
  }
}

interface ITaskListEntryProps {
  window: any;
}

class TaskListEntry extends React.Component<ITaskListEntryProps> {
  render() {
    const window = this.props.window;

    let className = "tasklistentry";
    if (window.focused)
      className += " focused";
    return (
      <div className={className} onClick={this.onClick.bind(this)}>
        {window.title}
      </div>
    );
  }

  onClick() {
    const win = this.props.window;
    if (win.focused)
      (window as any).commands.minimizeWindow(win.id);
    else
      (window as any).commands.raiseWindow(win.id);
  }
}

const RunField: any = connect(mapStateToProps)(class RunField extends React.Component<any> {
  field: any;

  constructor(props: any) {
    super(props);

    this.onChange = this.onChange.bind(this);
    this.onKeyPress = this.onKeyPress.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onBlur = this.onBlur.bind(this);
  }

  render() {
    return (
      <input type="text" value={this.props.runCommand}
        className="taskbarRunField"
        ref={(input) => { this.field = input; }}
        onChange={this.onChange}
        onKeyPress={this.onKeyPress}
        onKeyDown={this.onKeyDown}
        onBlur={this.onBlur} />
    );
  }

  onChange(event: any) {
    this.props.dispatch(actions.setTaskbarRunFieldText(event.target.value));
  }

  onKeyPress(event: React.KeyboardEvent) {
    const command = this.props.runCommand;
    if (command && event.key === "Enter") {
      (window as any).commands.exec(this.props.runCommand);
      this.reset();
      event.preventDefault();
    }
  }

  onKeyDown(event: React.KeyboardEvent) {
    if (event.keyCode === 27 /*esc*/) {
      this.reset();
    }
  }

  onBlur() {
    this.reset();
  }

  reset() {
    this.props.dispatch(actions.setTaskbarRunFieldText(""));
    this.props.dispatch(actions.toggleTaskbarRunField(false));
  }

  componentDidMount() {
    this.field.focus();
  }
});

function mapStateToProps(state: any) {
  return Object.assign({}, state.taskbar);
}

export const Taskbar: any = connect(mapStateToProps)(TaskbarComp);
