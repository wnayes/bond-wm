import * as React from "react";
import { PropsWithChildren, useCallback } from "react";
import { showContextMenu } from "@electron-wm/shared-renderer";
import { ContextMenuKind } from "@electron-wm/shared";

export interface IDesktopProps extends PropsWithChildren {}

export function Desktop({ children }: IDesktopProps) {
  const onContextMenu = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    showContextMenu(ContextMenuKind.Desktop);
  }, []);

  return (
    <div id="desktop" onContextMenu={onContextMenu}>
      {children}
    </div>
  );
}
