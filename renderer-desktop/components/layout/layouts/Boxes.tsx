import * as React from "react";

import { ILayoutProps } from "../Layout";
import { Window } from "../Window";

export function Boxes({ windows }: ILayoutProps) {
  const winComponents = [];
  for (const win of windows) {
    winComponents.push(<Window window={win} key={win.id} />);
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: windows?.length > 1 ? "1fr 1fr" : "1fr",
        height: "100%",
        width: "100%",
      }}
    >
      {winComponents}
    </div>
  );
}
