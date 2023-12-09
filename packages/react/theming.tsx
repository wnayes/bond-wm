import React from "react";
import { createTheming } from "@callstack/react-theme-provider";

export interface Theme {
  primaryColor: string;
  urgentColor: string;
  window?: {
    activeColor?: string;
    activeBorderColor?: string;
    inactiveColor?: string;
    inactiveBorderColor?: string;
    urgentColor?: string;
    urgentBorderColor?: string;
  };
}

const DefaultTheme: Theme = {
  primaryColor: "#7269d2",
  urgentColor: "#C3723D",
};

const { ThemeProvider, useTheme: useThemeInternal } = createTheming(DefaultTheme);

export const ThemeContextProvider: React.FC<React.PropsWithChildren<{ theme: Theme }>> = ({ theme, children }) => {
  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
};

export function useTheme(): Theme {
  return useThemeInternal();
}
