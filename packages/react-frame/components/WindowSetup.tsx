import * as React from "react";
import { Root, createRoot } from "react-dom/client";
import { Provider, useSelector } from "react-redux";

import { RootState, Store, frameWindowMouseEnter, resolvePluginsFromRenderer } from "@electron-wm/renderer-shared";
import { ipcRenderer } from "electron";
import { WidContext } from "@electron-wm/plugin-utils";
import { FrameModule, PluginInstance, PluginSpecifiers } from "@electron-wm/shared";
import { FunctionComponent, FunctionComponentElement, useEffect, useState } from "react";

interface ReactFrameSettings {
  config: PluginSpecifiers;
}

interface ReactFrameConfigModule {
  default: FunctionComponent;
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
  const frameConfig = useSelector((state: RootState) => state.config.plugins?.frame);
  const [frameConfigSpecifier, setFrameConfigSpecifiers] = useState<PluginSpecifiers | null | undefined>(null);

  const [frameComponent, setFrameComponent] = useState<FunctionComponentElement<{}> | null>(null);

  useEffect(() => {
    (async () => {
      if (frameConfig) {
        const plugins = await resolvePluginsFromRenderer<PluginInstance<FrameModule, ReactFrameSettings>>(frameConfig);
        plugins.forEach((frameModule) => {
          setFrameConfigSpecifiers(frameModule.settings?.config);
        });
      }
    })();
  }, [frameConfig]);

  useEffect(() => {
    (async () => {
      if (frameConfigSpecifier) {
        const plugins = await resolvePluginsFromRenderer<PluginInstance<ReactFrameConfigModule>>(frameConfigSpecifier);
        const components = plugins
          .map((frameModule, i) => {
            const frameComponent = frameModule.exports.default;
            if (typeof frameComponent === "function") {
              return React.createElement(frameComponent, { key: i });
            }
          })
          .filter((component) => component != null) as FunctionComponentElement<{}>[];
        setFrameComponent(components[0]);
      }
    })();
  }, [frameConfigSpecifier]);

  return frameComponent;
}
