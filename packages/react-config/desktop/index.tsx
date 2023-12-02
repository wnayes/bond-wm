import React from "react";
import { Desktop, WorkArea, useScreenIndex } from "@electron-wm/plugin-utils";
import { ErrorBoundary } from "react-error-boundary";
import { ErrorDisplay } from "@electron-wm/renderer-shared";
import { Taskbar, TagList, TaskList, RunField, SystemTray, Clock, LayoutIndicator } from "@electron-wm/taskbar";

export default () => {
  const screenIndex = useScreenIndex();
  return (
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
  );
};
