import * as React from "react";
import { Root, createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { WindowFrame } from "./WindowFrame";
import { Store } from "@electron-wm/renderer-shared";
import { ipcRenderer } from "electron";

let _reactRoot: Root;
let _store: Store;

export function setupWindowComponent(container: HTMLElement, store: Store): void {
  _reactRoot = createRoot(container);
  _store = store;

  let wid: number | undefined;
  const urlParams = new URLSearchParams(window.location.search);
  const widParam = urlParams.get("wid");
  if (widParam) {
    wid = parseInt(widParam, 10);
    console.log("wid", wid);
  } else {
    ipcRenderer.on("set-frame-wid", (event, wid: number) => {
      renderWindowFrame(wid);
    });
  }

  renderWindowFrame(wid);
}

function renderWindowFrame(wid?: number): void {
  _reactRoot.render(
    <Provider store={_store}>
      <WindowFrame wid={wid} />
    </Provider>
  );
}
