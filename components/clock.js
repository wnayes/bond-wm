const React = require("react");
const ReactDOM = require("react-dom");

const moment = require("moment");

class Clock extends React.Component {
  render() {
    return (
      <div className="clock">
        {this.getTime()}
      </div>
    );
  }

  componentDidMount() {
    this.interval = setInterval(this.tick.bind(this), 10000);
  }
  componentWillUnmount() {
    clearInterval(this.interval);
  }

  tick() {
    let timeDiv = ReactDOM.findDOMNode(this);
    timeDiv.textContent = this.getTime();
  }

  getTime() {
    return moment().format("h:mm A");
  }
}

module.exports = Clock;