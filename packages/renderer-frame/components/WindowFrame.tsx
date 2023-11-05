import * as React from "react";
import { useBrowserWindowSize } from "@electron-wm/plugin-utils";
import { isUrgent } from "@electron-wm/shared";
import { useWindow } from "@electron-wm/plugin-utils";

interface IWindowFrameProps extends React.PropsWithChildren<{}> {}

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

  const style: React.CSSProperties = {};
  if (typeof win?.borderWidth === "number") {
    style.borderWidth = win.borderWidth;
  }

  return (
    <div className={className} style={style}>
      {children}
    </div>
  );
}
