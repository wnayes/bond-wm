import { WMSizeHints } from "../wm/icccm";

export interface IScreen {
  index: number;

  root: number;

  x: number;
  y: number;
  width: number;
  height: number;
  workArea: IGeometry;

  tags: string[];
  currentTags: string[];
}

export interface IGeometry {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface IBounds {
  top: number;
  left: number;
  bottom: number;
  right: number;
}

export interface IWindow {
  id: number;
  outer: IGeometry;
  inner: IBounds;
  visible: boolean;
  focused: boolean;
  decorated: boolean;
  title: string | undefined;
  screenIndex: number;
  tags: string[];
  normalHints: WMSizeHints | undefined;
}
