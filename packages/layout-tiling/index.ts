/// <reference types="vite/client" />
import {
  IGeometry,
  LayoutFunction,
  LayoutPluginConfig,
  WindowPosition,
  addLayoutResult,
  windowIsDialog,
} from "@bond-wm/shared";
import TilingIcon from "./tiling.png";

const TilingLayout: LayoutFunction = ({ windows, screen }) => {
  const results = new Map<number, IGeometry>();

  const { workArea } = screen;

  const windowsWithinGrid = [];

  for (const win of windows) {
    if (win.fullscreen) {
      addLayoutResult(results, win, screen, {
        x: 0,
        y: 0,
        width: screen.width,
        height: screen.height,
      });
    } else if (windowIsDialog(win)) {
      // Center the window.
      addLayoutResult(results, win, screen, {
        x: workArea.x + Math.max(0, Math.floor((workArea.width - win.outer.width) / 2)),
        y: workArea.y + Math.max(0, Math.floor((workArea.height - win.outer.height) / 2)),
        width: win.outer.width,
        height: win.outer.height,
      });
    } else if (win.position === WindowPosition.UserPositioned) {
      addLayoutResult(results, win, screen, {
        x: win.outer.x,
        y: win.outer.y,
        width: win.outer.width,
        height: win.outer.height,
      });
    } else {
      windowsWithinGrid.push(win);
    }
  }

  const GridWidth = 2;
  const GridHeight = Math.ceil(windowsWithinGrid.length / GridWidth);
  const GridCellWidth = Math.floor(workArea.width / GridWidth);
  const GridCellHeight = Math.floor(workArea.height / GridHeight);
  let x = 0;
  let y = 0;
  for (let i = 0; i < windowsWithinGrid.length; i++) {
    const win = windowsWithinGrid[i];

    // When the last window is odd out, give it the full remaining Grid width.
    // This assumes GridWidth == 2 but could be generalized if needed.
    if (i === windowsWithinGrid.length - 1 && windowsWithinGrid.length % 2 !== 0) {
      addLayoutResult(results, win, screen, {
        x: workArea.x + x * GridCellWidth,
        y: workArea.y + y * GridCellHeight,
        width: workArea.width,
        height: GridCellHeight,
      });
      continue;
    }

    addLayoutResult(results, win, screen, {
      x: workArea.x + x * GridCellWidth,
      y: workArea.y + y * GridCellHeight,
      width: GridCellWidth,
      height: GridCellHeight,
    });

    x++;
    if (x >= GridWidth) {
      x = 0;
      y++;
    }
  }

  return results;
};

/** A tiling layout for bond-wm. */
const Plugin: LayoutPluginConfig = {
  name: "Tiling",
  icon: TilingIcon,
  supportsMaximize: false,
  fn: TilingLayout,
};
export default Plugin;
