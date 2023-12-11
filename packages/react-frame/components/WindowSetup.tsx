import * as React from "react";
import { Root, createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { Store, frameWindowMouseEnter } from "@electron-wm/shared-renderer";
import { ipcRenderer } from "electron";
import { WidContext } from "@electron-wm/react";
import { getConfigAsync } from "@electron-wm/shared";
import { FunctionComponentElement, useEffect, useState } from "react";

interface ReactFrameSettings {
  frameComponent: React.FunctionComponent;
}

let _store: Store;

export function setupWindowComponent(container: HTMLElement, store: Store): void {
  _store = store;

  let wid: number | undefined;
  const urlParams = new URLSearchParams(window.location.search);
  const widParam = urlParams.get("wid");
  if (widParam) {
    wid = parseInt(widParam, 10);
    console.log("wid", wid);
  } else {
    ipcRenderer.on("set-frame-wid", (event, newWid: number) => {
      wid = newWid;
      renderWindowFrame(container, newWid);
    });
  }

  container.ownerDocument.addEventListener("mouseenter", () => {
    if (wid) {
      frameWindowMouseEnter(wid);
    }
  });

  renderWindowFrame(container, wid);
}

let _reactRoot: Root;

function renderWindowFrame(container: HTMLElement, wid?: number): void {
  if (!_reactRoot) {
    _reactRoot = createRoot(container);
  }
  _reactRoot.render(<WindowFrameWrapper wid={wid} />);
}

interface WindowFrameWrapperProps {
  wid?: number;
}

function WindowFrameWrapper({ wid }: WindowFrameWrapperProps) {
  return (
    <Provider store={_store}>
      <WidContext.Provider value={wid}>
        <WindowFrameComponentWrapper />
      </WidContext.Provider>
    </Provider>
  );
}

function WindowFrameComponentWrapper() {
  const [frameComponent, setFrameComponent] = useState<FunctionComponentElement<{}> | null>(null);

  useEffect(() => {
    (async () => {
      const config = await getConfigAsync();
      if (config.frame.settings) {
        const frameComponent = (config.frame.settings as ReactFrameSettings).frameComponent;
        const frameElement = React.createElement(frameComponent, {});
        setFrameComponent(frameElement);
      }
    })();
  }, []);

  return frameComponent;
}
