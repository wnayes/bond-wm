import * as ReactDesktop from "@electron-wm/react-desktop";
import * as ReactFrame from "@electron-wm/react-frame";
import Desktop from "./desktop/index";
import Frame from "./frame/index";
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

  /** Desktop configuration. */
  desktop: {
    module: ReactDesktop,
    settings: {
      desktopComponent: Desktop,
    },
  },

  /** Window frame configuration. */
  frame: {
    module: ReactFrame,
    settings: {
      frameComponent: Frame,
    },
  },

  /** Layouts available to cycle through. */
  layouts: [createFloatingLayout({ floatRight: false }), LayoutTiling],
};
