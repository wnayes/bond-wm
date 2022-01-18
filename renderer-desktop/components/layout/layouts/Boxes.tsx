import * as React from "react";

import { ILayoutProps } from "../Layout";
import { Window } from "../Window";

export function Boxes({ windows }: ILayoutProps) {
  const windowComponents = [];
  const fullscreenWindowComponents = [];
  for (const win of windows) {
    if (win.fullscreen) {
      fullscreenWindowComponents.push(<Window win={win} key={win.id} />);
    }
    else {
      windowComponents.push(<Window win={win} key={win.id} />);
    }
  }

  return <>
    <div
      style={{
        display: "grid",
        gridTemplateColumns: windows?.length > 1 ? "1fr 1fr" : "1fr",
        height: "100%",
        width: "100%",
      }}
    >
      {windowComponents}
    </div>
    {fullscreenWindowComponents}
  </>;
}
