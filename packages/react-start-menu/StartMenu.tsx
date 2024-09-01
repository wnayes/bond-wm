import React, { PropsWithChildren } from "react";
import { Stylesheet, useTheme } from "@bond-wm/react";
import styles from "./StartMenuStyles.css?url";

interface StartMenuStyle extends React.CSSProperties {
  "--start-menu-bg-color": string;
  "--start-menu-entry-hover-bg-color": string;
  "--start-menu-entry-hover-text-color": string;
}

export function StartMenu(props: PropsWithChildren<{}>) {
  const theme = useTheme();
  const startMenuStyle: StartMenuStyle = {
    "--start-menu-bg-color": theme.startmenu?.backgroundColor ?? theme.taskbar?.backgroundColor,
    "--start-menu-entry-hover-bg-color": theme.startmenu?.entryHoverColor ?? theme.primaryColor,
    "--start-menu-entry-hover-text-color":
      theme.startmenu?.entryHoverForeColor ?? theme.taskbar?.activeForeColor ?? theme.taskbar?.foreColor,
  };

  return (
    <>
      <Stylesheet href={styles} />
      <div className="startMenu" style={startMenuStyle}>
        {props.children}
      </div>
    </>
  );
}
