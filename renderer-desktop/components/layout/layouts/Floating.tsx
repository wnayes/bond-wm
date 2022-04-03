import * as React from "react";
import { ILayout } from "../../../layouts";
import { ILayoutProps } from "../Layout";
import { Window } from "../Window";

export function Floating({ windows, screen }: ILayoutProps) {
  const windowComponents = [];
  const fullscreenWindowComponents = [];
  for (const win of windows) {
    if (win.fullscreen) {
      fullscreenWindowComponents.push(<Window key={win.id} win={win} screen={screen} />);
    } else {
      windowComponents.push(<Window key={win.id} win={win} screen={screen} />);
    }
  }

  return (
    <>
      <div
        style={{
          height: "100%",
          width: "100%",
          position: "absolute",
        }}
      >
        {windowComponents}
      </div>
      {fullscreenWindowComponents}
    </>
  );
}

export const FloatingLayout: ILayout = {
  name: "Floating",
  icon: "assets/layout/floating.png",
  component: Floating,
};
