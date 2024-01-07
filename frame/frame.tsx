import React from "react";
import { WindowFrame, WindowClientArea, ThemeContextProvider } from "@bond-wm/react";
import {
  TitleBar,
  TitleBarCloseButton,
  TitleBarIcon,
  TitleBarMaximizeButton,
  TitleBarMinimizeButton,
  TitleBarText,
} from "@bond-wm/react-titlebar";
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
