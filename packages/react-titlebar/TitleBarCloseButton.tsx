import * as React from "react";
import { useCallback } from "react";
import { closeWindow } from "@bond-wm/shared-renderer";
import { useWindow } from "@bond-wm/react";
import closeImg from "./assets/close.svg";

export function TitleBarCloseButton() {
  const win = useWindow();
  const winId = win?.id;
  const onClick = useCallback(() => {
    if (typeof winId === "number") {
      closeWindow(winId);
    }
  }, [winId]);

  if (!win) {
    return null;
  }

  return (
    <div className="winTitleBarBtn winTitleBarCloseBtn" onClick={onClick} title="Close">
      <img className="winTitleBarBtnIcon" src={closeImg} />
    </div>
  );
}
