const React = require("react");
const ReactDOM = require("react-dom");

class TitleBar extends React.Component {
  render() {
    const window = this.props.window;
    return (
      <div className="winTitleBar">
          <span className="winTitleBarText">{window.title}</span>
          <TitleBarCloseButton window={window} />
      </div>
    );
  }
}

class TitleBarCloseButton extends React.Component {
  render() {
    const window = this.props.window;
    return (
      <div className="winTitleBarCloseBtn" onClick={this.onClick.bind(this)}>X</div>
    );
  }

  onClick() {
    window.commands.closeWindow(this.props.window.id);
  }
}

module.exports = TitleBar;