import * as React from "react";
import { useSelector } from "react-redux";
import { RootState } from "@electron-wm/renderer-shared";
import { useBrowserWindowSize } from "@electron-wm/plugin-utils";
import { isUrgent } from "@electron-wm/shared";
import { TitleBar } from "./TitleBar";
import { WindowClientArea } from "./WindowClientArea";

interface IWindowFrameProps {
  wid: number | undefined;
}

/**
 * Component that renders a window frame around a client window.
 */
export function WindowFrame(props: IWindowFrameProps) {
  const { wid } = props;

  const win = useSelector((state: RootState) => (typeof wid === "number" ? state.windows[wid] : null));

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

  let titlebar;
  if (win?.decorated && !win?.fullscreen) {
    titlebar = <TitleBar win={win} />;
  }

  useBrowserWindowSize(); // Triggers re-renders on resize.

  return (
    <div className={className} style={style}>
      {titlebar}
      <WindowClientArea win={win} />
    </div>
  );
}
