import React from "react";

import { WindowWrapper } from "./WindowWrapper";

export class WindowArea extends React.Component<any> {
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
