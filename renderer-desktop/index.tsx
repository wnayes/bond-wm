import * as React from "react";
import * as ReactDOM from "react-dom";
import { Provider } from "react-redux";
import { Desktop } from "../containers/Desktop";
import { configureStore } from "../renderer-shared/configureStore";
import { setupIpc } from "../renderer-shared/ipcRenderer";

let store = configureStore();
(window as any).store = store;

ReactDOM.render(
  <Provider store={store}>
    <Desktop />
  </Provider>,
  document.getElementById("content")
);

setupIpc(store);
