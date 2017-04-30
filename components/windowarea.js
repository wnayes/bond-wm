const React = require("react");
const ReactDOM = require("react-dom");

const WindowWrapper = require("./windowwrapper.js");

class WindowArea extends React.Component {
  render() {
    const windows = this.props.windows;
    const divWins = [];
    for (let wid in windows) {
      const window = windows[wid];
      if (!window.visible)
        continue;
      divWins.push(
        <WindowWrapper key={wid} window={window} />
      );
    }

    return <div id="windowarea">
      {divWins}
    </div>;
  }
}

module.exports = WindowArea;
