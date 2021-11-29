import React from "react";

import { connect } from "react-redux";

import { Taskbar } from "../components/Taskbar";
//const { WindowArea } from "../components/windowarea";

interface IDesktopProps {
  windows: any[];
}

class DesktopComp extends React.Component<IDesktopProps> {
  render() {
    //console.log(this.props);
    return (
      <div id="desktop">
        <Taskbar windows={this.props.windows} />
        {/* <WindowArea windows={this.props.windows} /> */}
      </div>
    );
  }
}

function mapStateToProps(state) {
  return Object.assign({}, state);
}

export const Desktop: any = connect(mapStateToProps)(DesktopComp);