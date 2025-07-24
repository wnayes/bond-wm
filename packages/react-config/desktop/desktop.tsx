import React from "react";
import { Desktop, ErrorDisplay, WorkArea, ThemeContextProvider, useScreenIndex, ChildWindow } from "@bond-wm/react";
import { StartMenu, StartMenuApplicationList, StartMenuButton } from "@bond-wm/react-start-menu";
import { ErrorBoundary } from "react-error-boundary";
import { DesktopEntries } from "@bond-wm/react-desktop-entries";
import { Taskbar, TagList, TaskList, SystemTray, Clock, LayoutIndicator } from "@bond-wm/react-taskbar";
import { Wallpaper } from "@bond-wm/react-wallpaper";
import { NotificationWindow } from "@bond-wm/react-notifications";
import { MyTheme } from "../theme";

const TaskbarHeight = 20;

export default () => {
  const screenIndex = useScreenIndex();
  return (
    <ThemeContextProvider theme={MyTheme}>
        <Desktop>
          <Taskbar height={TaskbarHeight}>
            {screenIndex === 0 && (
              <StartMenuButton>
                {() => (
                  <ChildWindow
                    alwaysOnTop
                    autoFocus
                    position={{ x: 0, y: TaskbarHeight }}
                    size={{ width: 300, height: screen.height / 2 }}
                  >
                    <StartMenu>
                      <StartMenuApplicationList groupBy="all" />
                    </StartMenu>
                  </ChildWindow>
                )}
              </StartMenuButton>
            )}
            <TagList />
            <TaskList />
            {screenIndex === 0 && <SystemTray />}
            <Clock />
            <LayoutIndicator />
          </Taskbar>
          <ErrorBoundary FallbackComponent={ErrorDisplay}>
            <WorkArea>
              <Wallpaper />
              <DesktopEntries />
            </WorkArea>
          </ErrorBoundary>
          {screenIndex === 0 && <NotificationWindow />}
        </Desktop>
    </ThemeContextProvider>
  );
};
