import { IGeometry } from "./types";

export interface IScreen {
  index: number;

  root: number;

  x: number;
  y: number;
  width: number;
  height: number;
  workArea: IGeometry;

  /** `zoomLevel` from Electron. */
  zoom: number;

  tags: string[];
  currentTags: string[];

  currentLayouts: { [tag: string]: string };
}
