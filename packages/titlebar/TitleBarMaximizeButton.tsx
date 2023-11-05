import * as React from "react";
import { useWindow } from "@electron-wm/plugin-utils";
import { useMaximizeHandler } from "./TitleBar";

export function TitleBarMaximizeButton() {
  const win = useWindow();
  const onClick = useMaximizeHandler(win);

  if (!win) {
    return null;
  }

  const graphic = win.maximized ? "./assets/restore.svg" : "./assets/maximize.svg";
  const tooltip = win.maximized ? "Restore" : "Maximize";

  return (
    <div className="winTitleBarBtn winTitleBarMaximizeBtn" onClick={onClick} title={tooltip}>
      <img className="winTitleBarBtnIcon" src={graphic} />
    </div>
  );
}
