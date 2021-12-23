import * as React from "react";

import { IScreen, IWindow } from "../../../shared/reducers";
import { Boxes } from "./layouts/Boxes";

export interface ILayoutProps {
    windows: IWindow[];
    screen: IScreen;
}

export const Layout: React.FC<ILayoutProps> = ({ screen, windows }) => {
    return <Boxes windows={windows} screen={screen} />;
}
