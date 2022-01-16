import * as React from "react";

import { IScreen, IWindow } from "../../../shared/types";
import { Boxes } from "./layouts/Boxes";

export interface ILayoutProps {
  windows: IWindow[];
  screen: IScreen;
}

export const Layout: React.FC<ILayoutProps> = ({ screen, windows }) => {
  return <Boxes windows={windows} screen={screen} />;
};
