import * as React from "react";
import { isUrgent } from "@electron-wm/shared";
import { useBrowserWindowSize } from "../useBrowserWindowSize";
import { useWindow } from "../useWindow";
import { useTheme } from "../theming";

interface IWindowFrameProps extends React.PropsWithChildren<{}> {}

interface WindowFrameStyle extends React.CSSProperties {
  "--window-active-bg-color": string;
  "--window-active-border-color": string;
  "--window-inactive-bg-color": string;
  "--window-inactive-border-color": string;
  "--window-urgent-bg-color": string;
  "--window-urgent-border-color": string;
}

/**
 * Component that renders a window frame around a client window.
 */
export function WindowFrame({ children }: IWindowFrameProps) {
  const win = useWindow();
  useBrowserWindowSize(); // Triggers re-renders on resize.

  let className = "winWrapper";
  if (win?.focused) {
    className += " focused";
  }
  if (win && isUrgent(win)) {
    className += " urgent";
  }
  if (win?.fullscreen) {
    className += " fullscreen";
  }
  if (win?.maximized) {
    className += " maximized";
  }

  const theme = useTheme();

  const style: WindowFrameStyle = {
    "--window-active-bg-color": theme.window?.activeBackgroundColor ?? theme.primaryColor,
    "--window-active-border-color":
      theme.window?.activeBorderColor ?? theme.window?.activeBackgroundColor ?? theme.primaryColor,
    "--window-inactive-bg-color": theme.window?.inactiveBackgroundColor,
    "--window-inactive-border-color": theme.window?.inactiveBorderColor ?? theme.window?.inactiveBackgroundColor,
    "--window-urgent-bg-color": theme.window?.urgentBackgroundColor ?? theme.urgentColor,
    "--window-urgent-border-color":
      theme.window?.urgentBorderColor ?? theme.window?.urgentBackgroundColor ?? theme.urgentColor,
  };
  if (typeof win?.borderWidth === "number") {
    style.borderWidth = win.borderWidth;
  }

  return (
    <div className={className} style={style}>
      {children}
    </div>
  );
}
