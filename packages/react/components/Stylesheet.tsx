import { useInsertionEffect } from "react";
import { useDomWindow } from "@bond-wm/react";

export interface IStylesheetProps {
  href: string;
}

/** Component that adds a stylesheet to the page. */
export function Stylesheet(props: IStylesheetProps) {
  const win = useDomWindow();

  const href = props.href;
  useInsertionEffect(() => {
    const link = win.document.createElement("link");
    link.type = "text/css";
    link.rel = "stylesheet";
    link.href = href;
    win.document.head.appendChild(link);

    return () => {
      win.document.head.removeChild(link);
    };
  }, [win, href]);

  return null;
}
