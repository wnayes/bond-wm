import * as React from "react";

import { IScreen } from "../../../shared/screen";
import { IWindow } from "../../../shared/window";
import { getLayouts } from "../../layouts";

export interface ILayoutProps {
  windows: IWindow[];
  screen: IScreen;
}

export const Layout: React.FC<ILayoutProps> = ({ screen, windows }) => {
  const layouts = getLayouts();

  const tag = screen.currentTags[0];
  const currentLayoutName = screen.currentLayouts[tag];
  let currentLayout = layouts.find((layout) => layout.name === currentLayoutName);
  if (!currentLayout) {
    currentLayout = layouts[0];
    console.warn(`Layout ${currentLayoutName} was unrecognized. Using fallback layout '${currentLayout.name}'.`);
  }

  const LayoutComponent = currentLayout.component;

  return <LayoutComponent windows={windows} screen={screen} />;
};
