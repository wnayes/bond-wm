import * as React from "react";
import { ILayout } from "../../../layouts";
import { ILayoutProps } from "../Layout";
import { Window } from "../Window";

export function Tiling({ windows, screen }: ILayoutProps) {
  const windowComponents = [];
  const fullscreenWindowComponents = [];
  for (const win of windows) {
    if (win.fullscreen) {
      fullscreenWindowComponents.push(<Window key={win.id} win={win} screen={screen} />);
    } else {
      windowComponents.push(<Window key={win.id} win={win} screen={screen} fill />);
    }
  }

  return (
    <>
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
    </>
  );
}

export const TilingLayout: ILayout = {
  name: "Tiling",
  icon: "assets/layout/tiling.png",
  component: Tiling,
};
