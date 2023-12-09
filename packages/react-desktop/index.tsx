import * as React from "react";
import { createRoot } from "react-dom/client";
import { Provider, useSelector } from "react-redux";
import { hookShortcuts } from "./shortcuts";
import {
  RootState,
  configureRendererStore,
  resolvePluginsFromRenderer,
  setPluginInstallDirectory,
  setupIpc,
} from "@electron-wm/shared-renderer";
import { ReactConfigModule, setScreenIndex } from "@electron-wm/react";
import { FunctionComponentElement, useEffect, useState } from "react";
import { DesktopModule, PluginInstance, PluginSpecifiers } from "@electron-wm/shared";

const screenIndex = getScreenIndex();
console.log(screenIndex);
setScreenIndex(screenIndex);

setPluginInstallDirectory(__dirname);

const store = configureRendererStore();
(window as any).store = store; // eslint-disable-line
setupIpc(store, screenIndex);

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
  config: PluginSpecifiers;
}

function DesktopComponentWrapper() {
  const desktopConfig = useSelector((state: RootState) => state.config.plugins?.desktop);
  const [desktopConfigSpecifier, setDesktopConfigSpecifiers] = useState<PluginSpecifiers | null | undefined>(null);

  const [desktopComponent, setDesktopComponent] = useState<FunctionComponentElement<{}> | null>(null);

  useEffect(() => {
    (async () => {
      if (desktopConfig) {
        const plugins =
          await resolvePluginsFromRenderer<PluginInstance<DesktopModule, ReactDesktopSettings>>(desktopConfig);
        plugins.forEach((desktopModule) => {
          setDesktopConfigSpecifiers(desktopModule.settings?.config);
        });
      }
    })();
  }, [desktopConfig]);

  useEffect(() => {
    (async () => {
      if (desktopConfigSpecifier) {
        const plugins = await resolvePluginsFromRenderer<PluginInstance<ReactConfigModule>>(desktopConfigSpecifier);
        const components = plugins
          .map((configModule, i) => {
            const desktopComponent = configModule.exports.Desktop;
            if (typeof desktopComponent === "function") {
              return React.createElement(desktopComponent, { key: i });
            }
          })
          .filter((component) => component != null) as FunctionComponentElement<{}>[];
        setDesktopComponent(components[0]);
      }
    })();
  }, [desktopConfigSpecifier]);

  return desktopComponent;
}
