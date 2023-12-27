import * as React from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { hookShortcuts } from "./shortcuts";
import { configureRendererStore, setupIpc } from "@electron-wm/shared-renderer";
import { setScreenIndex } from "@electron-wm/react";
import { FunctionComponentElement, useEffect, useState } from "react";
import { getDesktopConfigAsync, setConfigPath } from "@electron-wm/shared";

const screenIndex = getScreenIndex();
console.log(screenIndex);
setScreenIndex(screenIndex);

const store = configureRendererStore();
(window as any).store = store; // eslint-disable-line
setupIpc(store, screenIndex);
setConfigPath(store.getState().config.configPath);

const reactRoot = createRoot(document.getElementById("content")!);
reactRoot.render(
  <Provider store={store}>
    <DesktopComponentWrapper />
  </Provider>
);

hookShortcuts(document.body);

function getScreenIndex(): number {
  const urlParams = new URLSearchParams(window.location.search);
  const screenIndex = parseInt(urlParams.get("screen") || "", 10);
  if (typeof screenIndex !== "number") {
    return -1;
  }
  return screenIndex;
}

interface ReactDesktopSettings {
  desktopComponent: React.FunctionComponent;
}

function DesktopComponentWrapper() {
  const [desktopComponent, setDesktopComponent] = useState<FunctionComponentElement<{}> | null>(null);

  useEffect(() => {
    (async () => {
      const desktopConfig = await getDesktopConfigAsync();
      if (desktopConfig.settings) {
        const desktopComponent = (desktopConfig.settings as ReactDesktopSettings).desktopComponent;
        const desktopElement = React.createElement(desktopComponent, {});
        setDesktopComponent(desktopElement);
      }
    })();
  }, []);

  return desktopComponent;
}
