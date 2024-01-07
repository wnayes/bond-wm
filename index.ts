import type { IConfig } from "@bond-wm/shared";
import { createFloatingLayout } from "@bond-wm/layout-floating";
import LayoutTiling from "@bond-wm/layout-tiling";

const DefaultTerminal = "xterm";
const DefaultLauncher = "dmenu_run";

const config: IConfig = {
  /** Layout to use initially. */
  initialLayout: "Floating",

  /** Tag to select initially. */
  initialTag: "1",

  /** Virtual desktop names. */
  tags: ["1", "2", "3", "4", "5", "6", "7", "8", "9"],

  /** Layouts available to cycle through. */
  layouts: [createFloatingLayout({ floatRight: false }), LayoutTiling],

  /** Called after the window manager initializes. Used to configure certain behaviors. */
  onWindowManagerReady: ({ wm }) => {
    // Establish keyboard shortcuts.
    wm.registerShortcuts({
      "Mod4 + o": () => wm.sendActiveWindowToNextScreen(),
      "Mod4 + r": () => wm.launchProcess(DefaultLauncher),

      "Mod4 + Return": () => wm.launchProcess(DefaultTerminal),
      "Mod4 + space": () => wm.switchToNextLayout(),

      "Mod4 + Shift + C": () => wm.closeFocusedWindow(),
      "Mod4 + Shift + M": () => wm.startDragFocusedWindow(),
      "Mod4 + Shift + Q": () => wm.quit(),

      "Mod4 + Shift + F12": () => wm.showDevtoolsForFocusedWindowFrame(),

      "Mod4 + Ctrl + r": () => wm.restart(),
    });
    for (let i = 1; i <= 9; i++) {
      wm.registerShortcuts({
        [`Mod4 + ${i}`]: async (args) => wm.setTagIndexForActiveDesktop(i - 1, args.wid),
        [`Mod4 + Shift + ${i}`]: () => wm.sendActiveWindowToTag(i - 1),
      });
    }
  },
};
export default config;
