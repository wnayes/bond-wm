const React = require("react");
const ReactDOM = require("react-dom");

const configureStore = require("./configureStore.js").configureStore;
let store = configureStore("renderer");
window.store = store;

const { Provider } = require("react-redux");

const Desktop = require("./containers/desktop.js");

ReactDOM.render(
  <Provider store={store}>
    <Desktop />
  </Provider>,
  document.getElementById("content")
);

const { ipcRenderer } = require("electron");

window.commands = {
  raiseWindow: function(wid) {
    ipcRenderer.send("raise-window", wid);
  },

  minimizeWindow: function(wid) {
    ipcRenderer.send("minimize-window", wid);
  },

  closeWindow: function(wid) {
    ipcRenderer.send("close-window", wid);
  },
};
