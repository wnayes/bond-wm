import * as React from "react";
import * as ReactDOM from "react-dom";
import { Provider } from "react-redux";
import { Desktop } from "./components/Desktop";
import { configureStore } from "../renderer-shared/configureStore";
import { setupIpc } from "../renderer-shared/ipcRenderer";
import { hookShortcuts } from "./shortcuts";
import { getScreenIndex } from "./utils";

const screenIndex = getScreenIndex();
console.log(screenIndex);

const store = configureStore();
(window as any).store = store; // eslint-disable-line
setupIpc(store, screenIndex);

ReactDOM.render(
  <Provider store={store}>
    <Desktop screenIndex={screenIndex} />
  </Provider>,
  document.getElementById("content")
);

hookShortcuts(document.body);
