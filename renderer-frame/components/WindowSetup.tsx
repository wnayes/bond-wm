import * as React from "react";
import * as ReactDOM from "react-dom";

import { Provider } from "react-redux";

import { WindowFrame } from "./WindowFrame";
import { Store } from "../../renderer-shared/configureStore";

export function setupWindowComponent(container: HTMLElement, store: Store): void {
  const urlParams = new URLSearchParams(window.location.search);
  const widParam = urlParams.get("wid");
  if (!widParam) {
    throw new Error("Frame had no window id parameter");
  }
  const wid = parseInt(widParam, 10);
  console.log("wid", wid);

  ReactDOM.render(
    <Provider store={store}>
      <WindowFrame wid={wid} />
    </Provider>,
    container
  );
}
