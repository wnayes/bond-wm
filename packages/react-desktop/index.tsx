import * as path from "node:path";
import * as React from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { Desktop } from "./components/Desktop";
import { hookShortcuts } from "./shortcuts";
import { getScreenIndex } from "./utils";
import { configureRendererStore, setPluginInstallDirectory, setupIpc } from "@electron-wm/renderer-shared";

if (typeof window !== "undefined" && window.location.href.includes("/react-desktop/index")) {
  const screenIndex = getScreenIndex();
  console.log(screenIndex);

  setPluginInstallDirectory(__dirname);

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
}

/** Returns the source path to use for the desktop window. */
export function getDesktopWindowSrc(): string {
  return `file://${path.join(__dirname, "./index.html")}`;
}

// For hacky internal plugins
export * from "./components/layout/WindowContainers";
export { Window } from "./components/layout/Window";
