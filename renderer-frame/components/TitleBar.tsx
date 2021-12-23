import * as React from "react";
import { closeWindow } from "../../renderer-shared/commands";

interface ITitleBarProps {
  window: any;
}

export class TitleBar extends React.Component<ITitleBarProps> {
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

interface ITitleBarCloseButtonProps {
  window: any;
}

class TitleBarCloseButton extends React.Component<ITitleBarCloseButtonProps> {
  render() {
    const window = this.props.window;
    return (
      <div className="winTitleBarCloseBtn" onClick={this.onClick.bind(this)}>X</div>
    );
  }

  onClick() {
    closeWindow(this.props.window.id);
  }
}
