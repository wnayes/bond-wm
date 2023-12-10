import { Stylesheet } from "@electron-wm/react";
import path from "node:path";
import { pathToFileURL } from "node:url";
import * as React from "react";
import { PropsWithChildren } from "react";

const styles = pathToFileURL(path.join(__dirname, "Taskbar.css")).toString();

interface ITaskbarProps extends PropsWithChildren {}

export function Taskbar({ children }: ITaskbarProps) {
  return (
    <>
      <Stylesheet href={styles} />
      <div className="taskbar">{children}</div>
    </>
  );
}
