import { createFloatingLayout } from "@electron-wm/layout-floating";
import LayoutTiling from "@electron-wm/layout-tiling";

export default {
  /** Layout to use initially. */
  initialLayout: "Floating",

  /** Tag to select initially. */
  initialTag: "1",

  /** Virtual desktop names. */
  tags: ["1", "2", "3", "4", "5", "6", "7", "8", "9"],

  /** Default terminal. */
  term: "xterm",

  /** Layouts available to cycle through. */
  layouts: [createFloatingLayout({ floatRight: false }), LayoutTiling],
};
