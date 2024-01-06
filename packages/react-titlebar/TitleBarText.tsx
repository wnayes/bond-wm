import * as React from "react";
import { useWindow } from "@bond-wm/react";
import { useMaximizeHandler } from "./TitleBar";

export function TitleBarText() {
  const win = useWindow();
  const onMaximizeClick = useMaximizeHandler(win);

  if (!win) {
    return null;
  }

  // FIXME: The double click doesn't work due to -webkit-app-region: drag.
  return (
    <span className="winTitleBarText" onDoubleClick={onMaximizeClick}>
      {win.title}
    </span>
  );
}
