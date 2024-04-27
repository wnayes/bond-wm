import React from "react";
import { WindowFrame, WindowClientArea, ThemeContextProvider } from "@bond-wm/react";
import {
  TitleBar,
  TitleBarCloseButton,
  TitleBarIcon,
  TitleBarText,
} from "@bond-wm/react-titlebar";
import { MyTheme } from "../theme";

export default () => {
  return (
    <ThemeContextProvider theme={MyTheme}>
      <WindowFrame>
        <TitleBar height={15}>
          <TitleBarIcon />
          <TitleBarText />
          <TitleBarCloseButton />
        </TitleBar>
        <WindowClientArea />
      </WindowFrame>
    </ThemeContextProvider>
  );
};
