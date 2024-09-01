import React from "react";
import { ISize } from "@bond-wm/shared";
import { FC, ReactNode, useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";
import { DomWindowContext } from "../useDomWindow";
import styles from "./ChildWindowStyles.css?url";
import { Stylesheet } from "./Stylesheet";

export interface IChildWindowProps {
  children?: ReactNode;
  position: { x: number; y: number };
  size: ISize;
}

/**
 * Component that renders a separate floating window.
 */
export const ChildWindow: FC<IChildWindowProps> = ({ children, position, size }) => {
  const [win, setWin] = useState<Window | null>(null);

  const [initialProps] = useState({ position, size });

  useLayoutEffect(() => {
    const features = [`width=${initialProps.size.width}`, `height=${initialProps.size.height}`].join(",");
    const w = window.open("about:blank", "_blank", features);
    setWin(w);
    return () => w?.close();
  }, [initialProps]);

  const { x, y } = position;
  useLayoutEffect(() => {
    win?.moveTo(x, y);
  }, [win, x, y]);

  useLayoutEffect(() => {
    win?.resizeTo(size.width, size.height);
  }, [win, size.width, size.height]);

  if (!win) return null;
  return (
    <DomWindowContext.Provider value={win}>
      <Stylesheet href={styles} />
      {createPortal(children, win.document.body)}
    </DomWindowContext.Provider>
  );
};
