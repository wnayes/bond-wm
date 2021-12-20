import * as React from "react";

import { connect } from "react-redux";

import { Taskbar } from "./Taskbar";

interface IDesktopProps {
  windows: any[];
}

class DesktopComp extends React.Component<any> {
  render() {
    return (
      <div id="desktop">
        <Taskbar windows={this.props.windows} />
      </div>
    );
  }
}

function mapStateToProps(state: any) {
  return Object.assign({}, state);
}

export const Desktop: any = connect(mapStateToProps)(DesktopComp);