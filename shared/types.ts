export interface ISize {
  width: number;
  height: number;
}

export interface IGeometry extends ISize {
  x: number;
  y: number;
}

export interface IBounds {
  top: number;
  left: number;
  bottom: number;
  right: number;
}

export type Coords = [x: number, y: number];
