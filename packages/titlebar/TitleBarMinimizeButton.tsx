import * as React from "react";
import { useCallback } from "react";
import { minimizeWindow } from "@electron-wm/renderer-shared";
import { useWindow } from "@electron-wm/react";
import minimizeImg from "./assets/minimize.svg";

export function TitleBarMinimizeButton() {
  const win = useWindow();
  const winId = win?.id;
  const onClick = useCallback(() => {
    if (typeof winId === "number") {
      minimizeWindow(winId);
    }
  }, [winId]);

  if (!win) {
    return null;
  }

  return (
    <div className="winTitleBarBtn winTitleBarMinimizeBtn" onClick={onClick} title="Minimize">
      <img className="winTitleBarBtnIcon" src={minimizeImg} />
    </div>
  );
}
