import * as React from "react";

import { IScreen } from "../../../shared/types";
import { IWindow } from "../../../shared/window";
import { Boxes } from "./layouts/Boxes";

export interface ILayoutProps {
  windows: IWindow[];
  screen: IScreen;
}

export const Layout: React.FC<ILayoutProps> = ({ screen, windows }) => {
  return <Boxes windows={windows} screen={screen} />;
};
