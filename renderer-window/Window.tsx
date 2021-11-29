import * as React from "react";
import * as ReactDOM from "react-dom";

import { Provider } from "react-redux";

import { WindowWrapper } from "../components/WindowWrapper";

export function setupWindowComponent(container: HTMLElement, store: any): void {
    ReactDOM.render(
        <Provider store={store}>
            <WindowWrapper />
        </Provider>,
        container
    );
}
