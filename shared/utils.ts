import { IGeometry, ISize } from "./types";

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

export function intersect<T>(arr1: T[] | null | undefined, arr2: T[] | null | undefined): T[] {
  if (!arr1 || !arr2) {
    return [];
  }
  const intersectArr = [];
  for (const item1 of arr1) {
    for (const item2 of arr2) {
      if (item1 === item2) {
        intersectArr.push(item1);
        break;
      }
    }
  }
  return intersectArr;
}

export function arraysEqual<T>(arr1: T[] | null | undefined, arr2: T[] | null | undefined): boolean {
  if (arr1 == arr2) {
    return true;
  }
  if (!arr1 || !arr2) {
    return false;
  }
  if (arr1.length !== arr2.length) {
    return false;
  }
  for (let i = 0; i < arr1.length; i++) {
    if (arr1[i] !== arr2[i]) {
      return false;
    }
  }
  return true;
}

export function geometriesDiffer(geo1: IGeometry | null | undefined, geo2: IGeometry | null | undefined): boolean {
  if (geo1 === geo2) {
    return false;
  }
  if ((!geo1 && geo2) || (geo1 && !geo2)) {
    return true;
  }
  if (!geo1 || !geo2) {
    return false;
  }

  return geo1.x !== geo2.x || geo1.y !== geo2.y || geo1.width !== geo2.width || geo1.height !== geo2.height;
}

export function geometryContains(geo: IGeometry, x: number, y: number): boolean {
  return x >= geo.x && x <= geo.x + geo.width && y >= geo.y && y <= geo.y + geo.height;
}

const MIN_SIZE = { height: 0, width: 0 };

/**
 * Makes a best effort to adjust one geometry to fit within another.
 * @param geoContainer Geometry acting as a container.
 * @param geoWithin Geometry we are trying to fit into the container.
 * @param geoWithinMinSize Minimum size of the geometry that must be respected.
 * @returns Potentially adjusted geometry.
 */
export function fitGeometryWithinAnother(
  geoContainer: IGeometry,
  geoWithin: IGeometry,
  geoWithinMinSize: ISize = MIN_SIZE
): IGeometry {
  const geoResult = { ...geoWithin };

  // Don't be taller/wider than the container if we can avoid it.
  if (geoResult.height > geoContainer.height) {
    geoResult.height = Math.max(geoContainer.height, geoWithinMinSize.height);
  }
  if (geoResult.width > geoContainer.width) {
    geoResult.width = Math.max(geoContainer.width, geoWithinMinSize.width);
  }

  // Don't fall out the right edge.
  const withinRightEdge = geoResult.x + geoResult.width;
  const containerRightEdge = geoContainer.x + geoContainer.width;
  if (withinRightEdge > containerRightEdge) {
    geoResult.x -= withinRightEdge - containerRightEdge;
  }

  // Don't fall out the left edge.
  if (geoResult.x < geoContainer.x) {
    geoResult.x = geoContainer.x;
  }

  // Don't fall out the bottom edge.
  const withinBottomEdge = geoResult.y + geoResult.height;
  const containerBottomEdge = geoContainer.y + geoContainer.height;
  if (withinBottomEdge > containerBottomEdge) {
    geoResult.y -= withinBottomEdge - containerBottomEdge;
  }

  // Don't fall out the top edge.
  if (geoResult.y < geoContainer.y) {
    geoResult.y = geoContainer.y;
  }

  return geoResult;
}

/**
 * Converts an array of numbers into a Buffer holding those numbers.
 * @param nums Numbers to put in the buffer (as 32 bit ints)
 * @returns Buffer filled with nums.
 */
export function numsToBuffer(nums: number[]): Buffer {
  const buffer = Buffer.alloc(nums.length * 4);
  for (let i = 0; i < nums.length; i++) {
    buffer.writeInt32LE(nums[i], i * 4);
  }
  return buffer;
}
