import { ILayoutProps } from "./components/layout/Layout";
import { getLayoutNames } from "../shared/layouts";

import { TilingLayout } from "./components/layout/layouts/Tiling";
import { FloatingLayout } from "./components/layout/layouts/Floating";

export interface ILayout {
  name: string;
  icon?: string;
  component: React.ComponentType<ILayoutProps>;
}

export function getLayouts(): ILayout[] {
  const layouts = [FloatingLayout, TilingLayout];

  return getLayoutNames().map((layoutName) => {
    return layouts.find((layout) => layout.name === layoutName);
  });
}
