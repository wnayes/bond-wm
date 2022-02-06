import type { WMSizeHints } from "../wm/icccm";
import { Coords, IBounds, IGeometry } from "./types";

/** Data describing an X window. */
export interface IWindow {
  /** X window id. */
  id: number;
  /** Position of the window relative to the current screen. */
  outer: IGeometry;
  /** Size of the frame border around each side of the window. */
  frameExtents: IBounds;
  visible: boolean;
  fullscreen: boolean;
  position: WindowPosition;
  focused: boolean;
  decorated: boolean;
  /** If set, indicates a specific border with the frame should respect. */
  borderWidth: number | undefined;
  title: string | undefined;
  wmClass: [string, string] | undefined;
  screenIndex: number;
  tags: string[];
  normalHints: WMSizeHints | undefined;
  dragState: DragState | undefined;
}

export enum WindowPosition {
  /** The window respects the layout for positioning. */
  Default = 0,

  /** The window has been user positioned. Layouts should respect this if able. */
  UserPositioned = 1,
}

export interface DragState {
  moving?: boolean;
  resize?: ResizeDirection;
  startCoordinates?: Coords;
  startOuterSize?: IGeometry;
}

export enum ResizeDirection {
  TopLeft = 1,
  Top = 2,
  TopRight = 3,
  Right = 4,
  BottomRight = 5,
  Bottom = 6,
  BottomLeft = 7,
  Left = 8,
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
