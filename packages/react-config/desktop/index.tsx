import React from "react";
import { Desktop, ErrorDisplay, WorkArea, useScreenIndex } from "@electron-wm/react";
import { ErrorBoundary } from "react-error-boundary";
import { Taskbar, TagList, TaskList, RunField, SystemTray, Clock, LayoutIndicator } from "@electron-wm/react-taskbar";

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
