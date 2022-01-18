import * as React from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../renderer-shared/configureStore";
import { useWindowSize } from "../../renderer-shared/hooks";

import { TitleBar } from "./TitleBar";
import { WindowClientArea } from "./WindowClientArea";

interface IWindowFrameProps {
  wid: number;
}

/**
 * Component that renders a window frame around a client window.
 */
export function WindowFrame(props: IWindowFrameProps) {
  const { wid } = props;

  const win = useSelector((state: RootState) => state.windows[wid]);

  let className = "winWrapper";
  if (win?.focused) {
    className += " focused";
  }
  if (win?.fullscreen) {
    className += " fullscreen";
  }

  let titlebar;
  if (win?.decorated && !win?.fullscreen) {
    titlebar = <TitleBar window={win} />;
  }

  useWindowSize(); // Triggers re-renders on resize.

  return (
    <div className={className}>
      {titlebar}
      <WindowClientArea wid={wid} />
    </div>
  );
}
