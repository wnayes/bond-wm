import * as React from "react";
import { FunctionComponentElement, useEffect, useState } from "react";
import { Clock } from "./Clock";
import { useSelector } from "react-redux";
import { resolvePluginsFromRenderer, RootState } from "@electron-wm/renderer-shared";
import { IWindow, PluginInstance, selectConfigWithOverrides, TaskbarModule } from "@electron-wm/shared";
import { RunField } from "./RunField";
import { TagList } from "./TagList";
import { TaskList } from "./TaskList";
import { SystemTray } from "./SystemTray";

interface ITaskbarProps {
  screenIndex: number;
  windows: IWindow[];
}

export function Taskbar(props: ITaskbarProps) {
  const windows = props.windows;

  const showingRun = useSelector((state: RootState) => state.taskbar.showingRun);

  const showSystemTray = props.screenIndex === 0; // TODO: Configurable
  const trayWindows = useSelector((state: RootState) => (showSystemTray ? state.tray.windows : null));

  const taskbarPluginComponents = useTaskbarComponents(props.screenIndex);

  return (
    <div className="taskbar">
      <>
        <TagList screenIndex={props.screenIndex} />
        {showingRun && <RunField />}
        <TaskList windows={windows} />
        {showSystemTray && <SystemTray trayWindows={trayWindows} />}
        <Clock />
        {taskbarPluginComponents}
      </>
    </div>
  );
}

function useTaskbarComponents(screenIndex: number) {
  const taskbarConfig = useSelector(
    (state: RootState) => selectConfigWithOverrides(state, screenIndex).plugins?.taskbar
  );

  const [taskbarComponents, setTaskbarComponents] = useState<FunctionComponentElement<{}>[]>([]);

  useEffect(() => {
    (async () => {
      if (!taskbarConfig) {
        setTaskbarComponents([]);
        return;
      }

      const plugins = await resolvePluginsFromRenderer<PluginInstance<TaskbarModule>>(taskbarConfig);
      const components = plugins
        .map((taskbarPlugin, i) => {
          const taskbarComponent = taskbarPlugin.exports.default;
          if (typeof taskbarComponent === "function") {
            return React.createElement(taskbarComponent, { key: i });
          } else if (typeof taskbarComponent === "object") {
            return React.createElement(taskbarComponent.component, { key: i });
          }
        })
        .filter((component) => component != null) as FunctionComponentElement<{}>[];
      setTaskbarComponents(components);
    })();
  }, [taskbarConfig]);

  return taskbarComponents;
}
