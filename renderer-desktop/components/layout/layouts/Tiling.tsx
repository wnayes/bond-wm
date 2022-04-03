import * as React from "react";
import { windowIsDialog } from "../../../../shared/window";
import { ILayout } from "../../../layouts";
import { ILayoutProps } from "../Layout";
import { Window } from "../Window";
import { CenteringContainer } from "../WindowContainers";

export function Tiling({ windows, screen }: ILayoutProps) {
  const windowComponents = [];
  const floatingCenterWindowComponents = [];
  const fullscreenWindowComponents = [];
  for (const win of windows) {
    if (win.fullscreen) {
      fullscreenWindowComponents.push(<Window key={win.id} win={win} screen={screen} />);
    } else if (windowIsDialog(win)) {
      floatingCenterWindowComponents.push(
        <CenteringContainer key={win.id}>
          <Window key={win.id} win={win} screen={screen} />
        </CenteringContainer>
      );
    } else {
      windowComponents.push(<Window key={win.id} win={win} screen={screen} fill />);
    }
  }

  return (
    <>
      <div
        style={{
          position: "absolute",
          display: "grid",
          gridTemplateColumns: windowComponents.length > 1 ? "1fr 1fr" : "1fr",
          height: "100%",
          width: "100%",
        }}
      >
        {windowComponents}
      </div>
      {floatingCenterWindowComponents}
      {fullscreenWindowComponents}
    </>
  );
}

export const TilingLayout: ILayout = {
  name: "Tiling",
  icon: "assets/layout/tiling.png",
  component: Tiling,
};
