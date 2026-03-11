import { WMHints, WMHintsFlags, WMSizeHints } from "./X";
import { Coords, IBounds, IGeometry } from "./types";
import { IScreen } from "./screen";

/** Data describing an X window. */
export interface IWindow {
  /** X window id. */
  id: number;
  /** Position of the window relative to the current screen. */
  outer: IGeometry;
  /** Size of the frame border around each side of the window. */
  frameExtents: IBounds;
  visible: boolean;
  minimized: boolean;
  maximized: boolean;
  /** If true, the window should usually be above other windows. */
  alwaysOnTop: boolean;
  fullscreen: boolean;
  type: WindowType;
  transientFor: number | undefined;
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
  icons: IIconInfo[] | undefined;
  _dragState: DragState | undefined;
  _originalSize: IGeometry | undefined;
}

export interface IIconInfo {
  width: number;
  height: number;
  data: number[];
}

export enum WindowType {
  Normal,
  Desktop,
  Dock,
  Toolbar,
  Menu,
  Utility,
  Splash,
  Dialog,
  DropdownMenu,
  PopupMenu,
  Tooltip,
  Notification,
  Combo,
  DragDrop,
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

export function getAbsoluteWindowGeometry(screen: IScreen, win: IWindow): IGeometry {
  return {
    ...win.outer,
    x: screen.x + win.outer.x,
    y: screen.y + win.outer.y,
  };
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
    return maxHeight;
  }
  return Infinity;
}

function normalizeHintSize(value: number | undefined): number | undefined {
  if (typeof value !== "number" || value <= 0) {
    return undefined;
  }
  return value;
}

function clampSize(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function applySizeHintsToDimension(
  desired: number,
  hints: WMSizeHints | undefined,
  dimension: "width" | "height"
): number {
  if (!hints) {
    return desired;
  }

  const min =
    dimension === "width" ? (normalizeHintSize(hints.minWidth) ?? 0) : (normalizeHintSize(hints.minHeight) ?? 0);
  const max =
    dimension === "width"
      ? (normalizeHintSize(hints.maxWidth) ?? Infinity)
      : (normalizeHintSize(hints.maxHeight) ?? Infinity);
  const base =
    dimension === "width" ? (normalizeHintSize(hints.baseWidth) ?? min) : (normalizeHintSize(hints.baseHeight) ?? min);
  const inc =
    dimension === "width" ? normalizeHintSize(hints.widthIncrement) : normalizeHintSize(hints.heightIncrement);

  const size = clampSize(desired, min, max);

  if (!inc || inc <= 1) {
    return size;
  }

  const baseValue = base ?? 0;
  const minAligned = baseValue + Math.ceil((min - baseValue) / inc) * inc;
  const maxAligned = Number.isFinite(max) ? baseValue + Math.floor((max - baseValue) / inc) * inc : Infinity;
  let snapped = baseValue + Math.floor((size - baseValue) / inc) * inc;

  if (Number.isFinite(maxAligned)) {
    snapped = Math.min(snapped, maxAligned);
  }
  snapped = Math.max(snapped, minAligned);

  return clampSize(snapped, min, max);
}

/**
 * Returns the width to use for a window, given a desired width.
 * The desired width will be returned unless it conflicts with dimension restrictions.
 */
export function newWidthForWindow(win: IWindow, desiredWidth: number): number {
  return applySizeHintsToDimension(desiredWidth, win.normalHints, "width");
}

/**
 * Returns the height to use for a window, given a desired height.
 * The desired height will be returned unless it conflicts with dimension restrictions.
 */
export function newHeightForWindow(win: IWindow, desiredHeight: number): number {
  return applySizeHintsToDimension(desiredHeight, win.normalHints, "height");
}

/** Tests if a window has any frame extents defined. */
export function hasAnyFrameExtents(win: Partial<IWindow>): win is Partial<IWindow> & { frameExtents: IBounds } {
  return !!(win.frameExtents?.top || win.frameExtents?.left || win.frameExtents?.right || win.frameExtents?.bottom);
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
    if (win.wmHints.flags & WMHintsFlags.InputHint) {
      return !!win.wmHints.input;
    }
  }
  return true;
}

export function windowIsDialog(win: IWindow): boolean {
  if (typeof win.transientFor === "number") {
    return true;
  }
  if (win.type === WindowType.Dialog) {
    return true;
  }
  return false;
}

/**
 * Returns true if the window is one that should display floated in the center
 * of the screen by default.
 */
export function windowFloatsCenter(win: IWindow): boolean {
  return windowIsDialog(win) || win.type === WindowType.Splash;
}
