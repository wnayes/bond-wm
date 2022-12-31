import * as React from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { Desktop } from "./components/Desktop";
import { configureRendererStore, setupIpc } from "@electron-wm/renderer-shared";
import { hookShortcuts } from "./shortcuts";
import { getScreenIndex } from "./utils";

const screenIndex = getScreenIndex();
console.log(screenIndex);

const store = configureRendererStore();
(window as any).store = store; // eslint-disable-line
setupIpc(store, screenIndex);

const reactRoot = createRoot(document.getElementById("content")!);
reactRoot.render(
  <Provider store={store}>
    <Desktop screenIndex={screenIndex} />
  </Provider>
);

hookShortcuts(document.body);
