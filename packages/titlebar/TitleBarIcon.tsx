import * as React from "react";
import { useIconInfoDataUri, useWindow } from "@electron-wm/plugin-utils";

export function TitleBarIcon() {
  const win = useWindow();
  const icons = win?.icons;
  const icon = icons?.[0]; // TODO: Pick "best" icon.
  const dataUri = useIconInfoDataUri(icon);

  // If there was no icon info, return null.
  // We expect dataUri to be absent the initial render; still render the img in preparation in this case.
  if (!icon) {
    return null;
  }

  return <img className="winTitleBarIcon" src={dataUri} />;
}
