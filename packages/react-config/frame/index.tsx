import React from "react";
import { WindowFrame, WindowClientArea } from "@electron-wm/react";
import {
  TitleBar,
  TitleBarCloseButton,
  TitleBarIcon,
  TitleBarMaximizeButton,
  TitleBarMinimizeButton,
  TitleBarText,
} from "@electron-wm/react-titlebar";

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
