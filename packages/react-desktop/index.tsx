import * as path from "node:path";
import * as React from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { hookShortcuts } from "./shortcuts";
import { getScreenIndex } from "./utils";
import { configureRendererStore, setPluginInstallDirectory, setupIpc } from "@electron-wm/renderer-shared";
import { Desktop, WorkArea } from "@electron-wm/plugin-utils";
import { ErrorBoundary } from "react-error-boundary";
import { ErrorDisplay } from "@electron-wm/renderer-shared";
import { Taskbar, TagList, TaskList, RunField, SystemTray, Clock, LayoutIndicator } from "@electron-wm/taskbar";

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
      <Desktop>
        <Taskbar>
          <TagList />
          <RunField />
          <TaskList />
          {screenIndex === 0 && <SystemTray />}
          <Clock />
          <LayoutIndicator />
        </Taskbar>
        <ErrorBoundary FallbackComponent={ErrorDisplay}>
          <WorkArea />
        </ErrorBoundary>
      </Desktop>
    </Provider>
  );

  hookShortcuts(document.body);
}

/** Returns the source path to use for the desktop window. */
export function getDesktopWindowSrc(): string {
  return `file://${path.join(__dirname, "./index.html")}`;
}