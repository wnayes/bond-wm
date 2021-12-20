import * as React from "react";
import * as ReactDOM from "react-dom";

import { Provider } from "react-redux";

import { WindowWrapper } from "../components/WindowWrapper";
import { Store } from "../renderer-shared/configureStore";

export function setupWindowComponent(container: HTMLElement, store: Store): void {
    const urlParams = new URLSearchParams(window.location.search);
    const wid = parseInt(urlParams.get("wid"), 10);
    console.log("wid", wid);

    //const win = store.getState().windows[wid];

    ReactDOM.render(
        <Provider store={store}>
            <WindowWrapper wid={wid} />
        </Provider>,
        container
    );
}
