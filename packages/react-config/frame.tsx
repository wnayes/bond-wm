import React from "react";
import * as ReactFrame from "@electron-wm/react-frame";
import { WindowFrame, WindowClientArea, ThemeContextProvider } from "@electron-wm/react";
import {
  TitleBar,
  TitleBarCloseButton,
  TitleBarIcon,
  TitleBarMaximizeButton,
  TitleBarMinimizeButton,
  TitleBarText,
} from "@electron-wm/react-titlebar";
import { MyTheme } from "./theme";

const MyFrame = () => {
  return (
    <ThemeContextProvider theme={MyTheme}>
      <WindowFrame>
        <TitleBar>
          <TitleBarIcon />
          <TitleBarText />
          <TitleBarMinimizeButton />
          <TitleBarMaximizeButton />
          <TitleBarCloseButton />
        </TitleBar>
        <WindowClientArea />
      </WindowFrame>
    </ThemeContextProvider>
  );
};

/** Window frame configuration. */
export default {
  module: ReactFrame,
  settings: {
    frameComponent: MyFrame,
  },
};
