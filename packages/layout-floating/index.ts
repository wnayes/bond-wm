/// <reference types="vite/client" />

import {
  IGeometry,
  LayoutFunction,
  LayoutPluginConfig,
  WindowPosition,
  addLayoutResult,
  windowFloatsCenter,
} from "@bond-wm/shared";
import FloatingIcon from "./floating.png";

interface IFloatingLayoutSettings {
  floatRight?: boolean;
}

export function createFloatingLayout(settings?: IFloatingLayoutSettings): LayoutPluginConfig {
  const floatRight = settings?.floatRight ?? false;
  const floatingLayout: LayoutFunction = ({ windows, screen }) => {
    const results = new Map<number, IGeometry>();
    const { workArea } = screen;

    let curX = floatRight ? workArea.x + workArea.width : workArea.x;
    let curY = workArea.y;
    let rowMaxHeight = 0;

    for (const win of windows) {
      if (win.fullscreen) {
        addLayoutResult(results, win, screen, {
          x: 0,
          y: 0,
          width: screen.width,
          height: screen.height,
        });
      } else if (win.maximized) {
        addLayoutResult(results, win, screen, {
          x: workArea.x,
          y: workArea.y,
          width: workArea.width,
          height: workArea.height,
        });
      } else if (win.position === WindowPosition.UserPositioned) {
        addLayoutResult(results, win, screen, {
          x: win.outer.x,
          y: win.outer.y,
          width: win.outer.width,
          height: win.outer.height,
        });
      } else if (windowFloatsCenter(win)) {
        // Center the window.
        addLayoutResult(results, win, screen, {
          x: workArea.x + Math.max(0, Math.floor((workArea.width - win.outer.width) / 2)),
          y: workArea.y + Math.max(0, Math.floor((workArea.height - win.outer.height) / 2)),
          width: win.outer.width,
          height: win.outer.height,
        });
      } else if (floatRight) {
        if (curX - win.outer.width < workArea.x) {
          // Wrap around to new row.
          curX = workArea.x + workArea.width;
          curY += rowMaxHeight;
          rowMaxHeight = 0;
        }
        addLayoutResult(results, win, screen, {
          x: curX - win.outer.width,
          y: curY,
          width: win.outer.width,
          height: win.outer.height,
        });
        curX -= win.outer.width;
        rowMaxHeight = Math.max(rowMaxHeight, win.outer.height);
      } else {
        if (curX + win.outer.width > workArea.x + workArea.width) {
          // Wrap around to new row.
          curX = workArea.x;
          curY += rowMaxHeight;
          rowMaxHeight = 0;
        }
        addLayoutResult(results, win, screen, {
          x: curX,
          y: curY,
          width: win.outer.width,
          height: win.outer.height,
        });
        curX += win.outer.width;
        rowMaxHeight = Math.max(rowMaxHeight, win.outer.height);
      }
    }

    return results;
  };

  /** A floating layout for bond-wm. */
  const plugin: LayoutPluginConfig = {
    name: "Floating",
    icon: FloatingIcon,
    supportsMaximize: true,
    fn: floatingLayout,
  };
  return plugin;
}
