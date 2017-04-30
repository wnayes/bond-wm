const React = require("react");
const ReactDOM = require("react-dom");

const Clock = require("./clock.js")

class Taskbar extends React.Component {
  render() {
    const windows = this.props.windows;
    return (
      <div className="taskbar">
        <TaskList windows={windows} />
        <Clock />
      </div>
    );
  }
}

class TaskList extends React.Component {
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

class TaskListEntry extends React.Component {
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
      window.commands.minimizeWindow(win.id);
    else
      window.commands.raiseWindow(win.id);
  }
}

module.exports = Taskbar;