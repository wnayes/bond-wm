import * as React from "react";
import { windowIsDialog } from "../../../../shared/window";
import { ILayout } from "../../../layouts";
import { ILayoutProps } from "../Layout";
import { Window } from "../Window";
import { BasicFillContainer, CenteringContainer } from "../WindowContainers";

export function Floating({ windows, screen }: ILayoutProps) {
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
      windowComponents.push(<Window key={win.id} win={win} screen={screen} />);
    }
  }

  return (
    <>
      <BasicFillContainer>{windowComponents}</BasicFillContainer>
      {floatingCenterWindowComponents}
      {fullscreenWindowComponents}
    </>
  );
}

export const FloatingLayout: ILayout = {
  name: "Floating",
  icon: "assets/layout/floating.png",
  component: Floating,
};
