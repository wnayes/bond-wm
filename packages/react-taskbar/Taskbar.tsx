import { useTheme } from "@bond-wm/react";
import * as React from "react";
import { PropsWithChildren } from "react";
import "./TaskbarStyles.css";

interface TaskbarStyle extends React.CSSProperties {
  "--desktop-taskbar-bg-color": string;

  "--desktop-tasklist-text-color": string;
  "--desktop-tasklist-text-shadow": string;
  "--desktop-tasklist-active-bg-color": string;
  "--desktop-tasklist-active-text-color": string;
  "--desktop-tasklist-urgent-bg-color": string;
  "--desktop-tasklist-urgent-text-color": string;
  "--desktop-tasklist-hover-bg-color": string;

  "--desktop-taglist-text-color": string;
  "--desktop-taglist-text-shadow": string;
  "--desktop-taglist-selected-bg-color": string;
  "--desktop-taglist-selected-text-color": string;
  "--desktop-taglist-hover-bg-color": string;
  "--desktop-taglist-urgent-bg-color": string;
  "--desktop-taglist-urgent-text-color": string;
  "--desktop-taglist-badge-color": string;

  "--desktop-layouts-hover-bg-color": string;

  "--desktop-clock-date-text-color": string;
  "--desktop-clock-date-text-shadow": string;
  "--desktop-clock-time-text-color": string;
  "--desktop-clock-time-text-shadow": string;
}

interface ITaskbarProps extends PropsWithChildren {
  height?: number;
  zIndex?: number;
}

export function Taskbar({ height, zIndex, children }: ITaskbarProps) {
  const theme = useTheme();
  const taskbarStyle: TaskbarStyle = {
    height: height ?? 20,
    zIndex: zIndex,

    "--desktop-taskbar-bg-color": theme.taskbar?.backgroundColor,

    "--desktop-tasklist-text-color": theme.taskbar?.tasklist?.foreColor ?? theme.taskbar?.foreColor,
    "--desktop-tasklist-text-shadow": theme.taskbar?.textShadow ?? "",
    "--desktop-tasklist-active-bg-color": theme.taskbar?.tasklist?.activeBackgroundColor ?? theme.primaryColor,
    "--desktop-tasklist-active-text-color":
      theme.taskbar?.tasklist?.activeForeColor ?? theme.taskbar?.activeForeColor ?? theme.taskbar?.foreColor,
    "--desktop-tasklist-urgent-bg-color": theme.taskbar?.tasklist?.urgentBackgroundColor ?? theme.urgentColor,
    "--desktop-tasklist-urgent-text-color":
      theme.taskbar?.tasklist?.urgentForeColor ??
      theme.taskbar?.activeForeColor ??
      theme.taskbar?.tasklist?.activeForeColor ??
      theme.taskbar?.foreColor,
    "--desktop-tasklist-hover-bg-color": theme.taskbar?.tasklist?.hoverBackgroundColor ?? theme.taskbar?.hoverColor,

    "--desktop-taglist-text-color": theme.taskbar?.taglist?.foreColor ?? theme.taskbar?.foreColor,
    "--desktop-taglist-text-shadow": theme.taskbar?.textShadow ?? "",
    "--desktop-taglist-selected-bg-color": theme.taskbar?.taglist?.selectedBackgroundColor ?? theme.primaryColor,
    "--desktop-taglist-selected-text-color":
      theme.taskbar?.taglist?.selectedForeColor ?? theme.taskbar?.activeForeColor ?? theme.taskbar?.foreColor,
    "--desktop-taglist-urgent-bg-color": theme.taskbar?.taglist?.urgentBackgroundColor ?? theme.urgentColor,
    "--desktop-taglist-urgent-text-color":
      theme.taskbar?.taglist?.urgentForeColor ??
      theme.taskbar?.taglist?.selectedForeColor ??
      theme.taskbar?.activeForeColor ??
      theme.taskbar?.foreColor,
    "--desktop-taglist-hover-bg-color": theme.taskbar?.taglist?.hoverBackgroundColor ?? theme.taskbar?.hoverColor,
    "--desktop-taglist-badge-color":
      theme.taskbar?.taglist?.badgeColor ?? theme.taskbar?.taglist?.selectedBackgroundColor ?? theme.primaryColor,

    "--desktop-layouts-hover-bg-color": theme.taskbar?.hoverColor,

    "--desktop-clock-date-text-color": theme.taskbar?.clock?.dateColor ?? theme.taskbar?.foreColor,
    "--desktop-clock-date-text-shadow": theme.taskbar?.textShadow ?? "",
    "--desktop-clock-time-text-color": theme.taskbar?.clock?.timeColor ?? theme.taskbar?.foreColor,
    "--desktop-clock-time-text-shadow": theme.taskbar?.textShadow ?? "",
  };

  return (
    <>
      <div className="taskbar" style={taskbarStyle}>
        {children}
      </div>
    </>
  );
}
