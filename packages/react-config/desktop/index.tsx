import React from "react";
import { Desktop, ErrorDisplay, WorkArea, ThemeContextProvider, useScreenIndex } from "@electron-wm/react";
import { ErrorBoundary } from "react-error-boundary";
import { Taskbar, TagList, TaskList, RunField, SystemTray, Clock, LayoutIndicator } from "@electron-wm/react-taskbar";
import { MyTheme } from "../theme";

export default () => {
  const screenIndex = useScreenIndex();
  return (
    <ThemeContextProvider theme={MyTheme}>
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
    </ThemeContextProvider>
  );
};
