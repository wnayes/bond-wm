import { Theme } from "@electron-wm/react";

export const MyTheme: Theme = {
  primaryColor: "#7269d2",
  urgentColor: "#C3723D",
  window: {
    foreColor: "#FFFFFF",
    inactiveBackgroundColor: "#333333",
    inactiveBorderColor: "#000000",
    titlebar: {
      closeButtonHoverColor: "#FF6961",
      minimizeButtonHoverColor: "#CEA32F",
      maximizeButtonHoverColor: "#0DAA49",
    },
  },
  taskbar: {
    foreColor: "black",
    backgroundColor: "#CCCCCC",
    hoverColor: "#BBBBBB",
    activeForeColor: "#EEEEEE",
    clock: {
      dateColor: "#444444",
    },
  },
};
