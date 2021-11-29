const React = require("react");
const ReactDOM = require("react-dom");

const Clock = require("./clock.js");

const { connect } = require("react-redux");

const actions = require("./../actions.js");

class Taskbar extends React.Component {
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

const RunField = connect(mapStateToProps)(class RunField extends React.Component {
  constructor(props) {
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

  onChange(event) {
    this.props.dispatch(actions.setTaskbarRunFieldText(event.target.value));
  }

  onKeyPress(event) {
    const command = this.props.runCommand;
    if (command && event.key === "Enter") {
      window.commands.exec(this.props.runCommand);
      this.reset();
      event.preventDefault();
    }
  }

  onKeyDown(event) {
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

function mapStateToProps(state) {
  return Object.assign({}, state.taskbar);
}

module.exports = connect(mapStateToProps)(Taskbar);
