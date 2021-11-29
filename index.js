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

require("./ipcRenderer.js")(store);
