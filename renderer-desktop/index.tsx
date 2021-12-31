import * as React from "react";
import * as ReactDOM from "react-dom";
import { Provider } from "react-redux";
import { Desktop } from "./components/Desktop";
import { configureStore } from "../renderer-shared/configureStore";
import { setupIpc } from "../renderer-shared/ipcRenderer";
import { hookShortcuts } from "./shortcuts";
import { getScreenIndex } from "./utils";

let store = configureStore();
(window as any).store = store;
setupIpc(store);

ReactDOM.render(
  <Provider store={store}>
    <Desktop screenIndex={getScreenIndex()} />
  </Provider>,
  document.getElementById("content")
);

hookShortcuts(document.body);
