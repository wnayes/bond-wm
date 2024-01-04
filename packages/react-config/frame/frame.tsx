import React from "react";
import { WindowFrame, WindowClientArea, ThemeContextProvider } from "@electron-wm/react";
import {
  TitleBar,
  TitleBarCloseButton,
  TitleBarIcon,
  TitleBarMaximizeButton,
  TitleBarMinimizeButton,
  TitleBarText,
} from "@electron-wm/react-titlebar";
import { MyTheme } from "../theme";

export default () => {
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
