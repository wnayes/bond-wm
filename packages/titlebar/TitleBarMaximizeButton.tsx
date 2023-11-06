import * as React from "react";
import { useWindow } from "@electron-wm/plugin-utils";
import { useMaximizeHandler } from "./TitleBar";
import maximizeImg from "./assets/maximize.svg";
import restoreImg from "./assets/restore.svg";

export function TitleBarMaximizeButton() {
  const win = useWindow();
  const onClick = useMaximizeHandler(win);

  if (!win) {
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
