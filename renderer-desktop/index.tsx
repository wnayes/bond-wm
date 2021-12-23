import * as React from "react";
import * as ReactDOM from "react-dom";
import { Provider } from "react-redux";
import { Desktop } from "./components/Desktop";
import { configureStore } from "../renderer-shared/configureStore";
import { setupIpc } from "../renderer-shared/ipcRenderer";

let store = configureStore();
(window as any).store = store;

const urlParams = new URLSearchParams(window.location.search);
const screen = parseInt(urlParams.get("screen"), 10);
console.log("screen", screen);

ReactDOM.render(
  <Provider store={store}>
    <Desktop screenIndex={screen} />
  </Provider>,
  document.getElementById("content")
);

setupIpc(store);
