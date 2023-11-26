import * as path from "node:path";

/** Returns the source path to use for the frame window. */
export function getFrameWindowSrc(): string {
  return `file://${path.join(__dirname, "./index.html")}`;
}
