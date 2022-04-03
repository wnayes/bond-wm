import { WMHints, WMHintsFlags, WMSizeHints } from "./X";
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
  acceptsFocus: boolean | undefined;
  decorated: boolean;
  /** If set, the window should display some sort of attention grabbing indication. */
  urgent: boolean | undefined;
  /** If set, indicates a specific border with the frame should respect. */
  borderWidth: number | undefined;
  title: string | undefined;
  wmClass: [string, string] | undefined;
  screenIndex: number;
  tags: string[];
  wmHints: WMHints | undefined;
  normalHints: WMSizeHints | undefined;
  dragState: DragState | undefined;
  sizeBeforeFullscreen: IGeometry | undefined;
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
  const minWidth = win.normalHints?.minWidth;
  if (minWidth && minWidth > 0) {
    return minWidth;
  }
  return 0;
}

export function getWindowMaxWidth(win: IWindow): number {
  const maxWidth = win.normalHints?.maxWidth;
  if (maxWidth && maxWidth > 0) {
    return maxWidth;
  }
  return Infinity;
}

export function getWindowMinHeight(win: IWindow): number {
  const minHeight = win.normalHints?.minHeight;
  if (minHeight && minHeight > 0) {
    return minHeight;
  }
  return 0;
}

export function getWindowMaxHeight(win: IWindow): number {
  const maxHeight = win.normalHints?.maxHeight;
  if (maxHeight && maxHeight > 0) {
    return maxHeight || 0;
  }
  return Infinity;
}

/**
 * Returns the width to use for a window, given a desired width.
 * The desired width will be returned unless it conflicts with dimension restrictions.
 */
export function newWidthForWindow(win: IWindow, desiredWidth: number): number {
  return Math.max(getWindowMinWidth(win), Math.min(getWindowMaxWidth(win), desiredWidth));
}

/**
 * Returns the height to use for a window, given a desired height.
 * The desired height will be returned unless it conflicts with dimension restrictions.
 */
export function newHeightForWindow(win: IWindow, desiredHeight: number): number {
  return Math.max(getWindowMinHeight(win), Math.min(getWindowMaxHeight(win), desiredHeight));
}

export function isUrgent(win: IWindow): boolean {
  if (typeof win.urgent === "boolean") {
    return win.urgent;
  }

  if (win.wmHints) {
    return hasUrgencyHint(win.wmHints);
  }

  return false;
}

function hasUrgencyHint(hints: WMHints): boolean {
  return !!(hints.flags & WMHintsFlags.UrgencyHint);
}

export function windowAcceptsFocus(win: IWindow): boolean {
  if (typeof win.acceptsFocus === "boolean") {
    return win.acceptsFocus;
  }

  if (win.wmHints) {
    return hasInputHint(win.wmHints);
  }
  return true;
}

function hasInputHint(hints: WMHints): boolean {
  return !!(hints.flags & WMHintsFlags.InputHint) && !!hints.input;
}
