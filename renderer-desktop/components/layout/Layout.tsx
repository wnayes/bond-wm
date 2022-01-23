import * as React from "react";

import { IScreen } from "../../../shared/types";
import { IWindow } from "../../../shared/window";
import { TilingLayout } from "./layouts/Tiling";
import { FloatingLayout } from "./layouts/Floating";
import { getLayoutNames } from "../../../shared/layouts";

export interface ILayout {
  name: string;
  component: React.ComponentType<ILayoutProps>;
}

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

function getLayouts(): ILayout[] {
  const layouts = [FloatingLayout, TilingLayout];

  return getLayoutNames().map((layoutName) => {
    return layouts.find((layout) => layout.name === layoutName);
  });
}
