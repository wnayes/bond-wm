import * as React from "react";
import { PropsWithChildren } from "react";

interface ITaskbarProps extends PropsWithChildren {}

export function Taskbar({ children }: ITaskbarProps) {
  return <div className="taskbar">{children}</div>;
}
