const React = require("react");
const ReactDOM = require("react-dom");

const { connect } = require("react-redux");

const Taskbar = require("../components/taskbar.js");
const WindowArea = require("../components/windowarea.js");

class Desktop extends React.Component {
  render() {
    //console.log(this.props);
    return (
      <div id="desktop">
        <Taskbar windows={this.props.windows} />
        <WindowArea windows={this.props.windows} />
      </div>
    );
  }
}

function mapStateToProps(state) {
  return Object.assign({}, state);
}

module.exports = connect(mapStateToProps)(Desktop)