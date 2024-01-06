import * as React from "react";
import { useSupportsMaximize, useWindow } from "@bond-wm/react";
import { useMaximizeHandler } from "./TitleBar";
import maximizeImg from "./assets/maximize.svg";
import restoreImg from "./assets/restore.svg";

export function TitleBarMaximizeButton() {
  const win = useWindow();
  const supportsMaximize = useSupportsMaximize(win);
  const onClick = useMaximizeHandler(win);

  if (!win || !supportsMaximize) {
    return null;
  }

  const graphic = win.maximized ? restoreImg : maximizeImg;
  const tooltip = win.maximized ? "Restore" : "Maximize";

  return (
    <div className="winTitleBarBtn winTitleBarMaximizeBtn" onClick={onClick} title={tooltip}>
      <img className="winTitleBarBtnIcon" src={graphic} />
    </div>
  );
}
