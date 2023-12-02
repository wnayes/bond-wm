import * as React from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { hookShortcuts } from "./shortcuts";
import { configureRendererStore, setPluginInstallDirectory, setupIpc } from "@electron-wm/renderer-shared";
import { Desktop, WorkArea, setScreenIndex } from "@electron-wm/plugin-utils";
import { ErrorBoundary } from "react-error-boundary";
import { ErrorDisplay } from "@electron-wm/renderer-shared";
import { Taskbar, TagList, TaskList, RunField, SystemTray, Clock, LayoutIndicator } from "@electron-wm/taskbar";

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

function getScreenIndex(): number {
  const urlParams = new URLSearchParams(window.location.search);
  const screenIndex = parseInt(urlParams.get("screen") || "", 10);
  if (typeof screenIndex !== "number") {
    return -1;
  }
  return screenIndex;
}
