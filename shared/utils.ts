import { IGeometry } from "./reducers";

export function anyIntersect<T>(arr1: T[] | null | undefined, arr2: T[] | null | undefined): boolean {
  if (!arr1 || !arr2) {
    return false;
  }
  for (const item1 of arr1) {
    for (const item2 of arr2) {
      if (item1 === item2) {
        return true;
      }
    }
  }
  return false;
}

export function geometriesDiffer(geo1: IGeometry | null | undefined, geo2: IGeometry | null | undefined): boolean {
  if ((!geo1 && geo2) || (geo1 && !geo2)) {
    return true;
  }

  return geo1.x !== geo2.x || geo1.y !== geo2.y || geo1.width !== geo2.width || geo1.height !== geo2.height;
}
