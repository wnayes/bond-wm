import { useInsertionEffect } from "react";

export interface IStylesheetProps {
  href: string;
}

/** Component that adds a stylesheet to the page. */
export function Stylesheet(props: IStylesheetProps) {
  const href = props.href;
  useInsertionEffect(() => {
    const link = document.createElement("link");
    link.type = "text/css";
    link.rel = "stylesheet";
    link.href = href;
    document.head.appendChild(link);

    return () => {
      document.head.removeChild(link);
    };
  }, [href]);

  return null;
}
