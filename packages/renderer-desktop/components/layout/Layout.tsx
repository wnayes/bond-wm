import * as React from "react";

import { IScreen } from "@electron-wm/shared";
import { useLayoutPlugins } from "@electron-wm/renderer-shared";

export interface ILayoutProps {
  screen: IScreen;
}

export const Layout: React.FC<ILayoutProps> = ({ screen }) => {
  const layouts = useLayoutPlugins();

  const tag = screen.currentTags[0];
  const currentLayoutName = screen.currentLayouts[tag];
  let currentLayout = layouts.find((layout) => layout.name === currentLayoutName);
  if (!currentLayout) {
    if (layouts.length > 0) {
      currentLayout = layouts[0];
      console.warn(`Layout ${currentLayoutName} was unrecognized. Using fallback layout '${currentLayout.name}'.`);
    } else {
      return null; // Not loaded yet (or config listed none?)
    }
  }

  const LayoutComponent = currentLayout.component;
  return <LayoutComponent />;
};
