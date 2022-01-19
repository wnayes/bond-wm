import type { WMSizeHints } from "../wm/icccm";
import { IBounds, IGeometry } from "./types";

export interface IWindow {
  id: number;
  outer: IGeometry;
  frameExtents: IBounds;
  visible: boolean;
  fullscreen: boolean;
  focused: boolean;
  decorated: boolean;
  title: string | undefined;
  screenIndex: number;
  tags: string[];
  normalHints: WMSizeHints | undefined;
}

export function getWindowMinWidth(win: IWindow): number {
  if (win.normalHints?.minWidth > 0) {
    return win.normalHints?.minWidth;
  }
  return 0;
}

export function getWindowMaxWidth(win: IWindow): number {
  if (win.normalHints?.maxWidth > 0) {
    return win.normalHints?.maxWidth;
  }
  return Infinity;
}

export function getWindowMinHeight(win: IWindow): number {
  if (win.normalHints?.minHeight > 0) {
    return win.normalHints?.minHeight;
  }
  return 0;
}

export function getWindowMaxHeight(win: IWindow): number {
  if (win.normalHints?.maxHeight > 0) {
    return win.normalHints?.maxHeight;
  }
  return Infinity;
}
