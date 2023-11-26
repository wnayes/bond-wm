import React from "react";
import { WindowFrame, WindowClientArea } from "@electron-wm/plugin-utils";
import {
  TitleBar,
  TitleBarCloseButton,
  TitleBarIcon,
  TitleBarMaximizeButton,
  TitleBarMinimizeButton,
  TitleBarText,
} from "@electron-wm/titlebar";

export default () => {
  return (
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
  );
};
