import * as path from "node:path";

/** Returns the source path to use for the desktop window. */
export function getDesktopWindowSrc(): string {
  return `file://${path.join(__dirname, "./index.html")}`;
}
