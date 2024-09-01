import React from "react";
import { createTheming } from "@callstack/react-theme-provider";

export interface Theme {
  primaryColor: string;
  urgentColor: string;
  window: {
    foreColor?: string;
    activeBackgroundColor?: string;
    activeBorderColor?: string;
    inactiveBackgroundColor: string;
    inactiveBorderColor?: string;
    urgentBackgroundColor?: string;
    urgentBorderColor?: string;
    titlebar?: {
      textColor?: string;
      buttonColor?: string;
      buttonHoverColor?: string;
      buttonIconColor?: string;
      closeButtonColor?: string;
      closeButtonHoverColor?: string;
      minimizeButtonColor?: string;
      minimizeButtonHoverColor?: string;
      maximizeButtonColor?: string;
      maximizeButtonHoverColor?: string;
    };
  };
  desktop?: {
    workareaColor?: string;
  };
  taskbar: {
    foreColor: string;
    backgroundColor: string;
    activeForeColor?: string;
    activeBackgroundColor?: string;
    hoverColor: string;
    taglist?: {
      selectedBackgroundColor?: string;
      selectedForeColor?: string;
      urgentBackgroundColor?: string;
      urgentForeColor?: string;
      hoverBackgroundColor?: string;
      badgeColor?: string;
    };
    tasklist?: {
      activeBackgroundColor?: string;
      activeForeColor?: string;
      urgentBackgroundColor?: string;
      urgentForeColor?: string;
      hoverBackgroundColor?: string;
    };
    clock?: {
      dateColor?: string;
      timeColor?: string;
    };
  };
  startmenu?: {
    backgroundColor?: string;
    entryHoverColor?: string;
    entryHoverForeColor?: string;
  };
}

const DefaultTheme: Theme = {
  primaryColor: "#7269d2",
  urgentColor: "#C3723D",
  window: {
    inactiveBackgroundColor: "#333333",
  },
  taskbar: {
    foreColor: "#000000",
    backgroundColor: "#CCCCCC",
    activeForeColor: "#EEEEEE",
    hoverColor: "#BBBBBB",
  },
};

const { ThemeProvider, useTheme: useThemeInternal } = createTheming(DefaultTheme);

export const ThemeContextProvider: React.FC<React.PropsWithChildren<{ theme: Theme }>> = ({ theme, children }) => {
  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
};

export function useTheme(): Theme {
  return useThemeInternal();
}
