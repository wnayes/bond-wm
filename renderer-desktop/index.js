const React = require("react");
const ReactDOM = require("react-dom");

const configureStore = require("../renderer-shared/configureStore.js").configureStore;
let store = configureStore();
window.store = store;

const { Provider } = require("react-redux");

const Desktop = require("../containers/desktop.js");

ReactDOM.render(
  <Provider store={store}>
    <Desktop />
  </Provider>,
  document.getElementById("content")
);

require("../renderer-shared/ipcRenderer.js")(store);
