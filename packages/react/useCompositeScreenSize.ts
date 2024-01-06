import { useSelector } from "react-redux";
import { RootState } from "@bond-wm/shared-renderer";
import { IGeometry, ISize } from "@bond-wm/shared";

/**
 * Returns the "composite size" of all screens together.
 * For example, if you have two monitors at 1920px wide each, the composite
 * width is 3840.
 * @param opts Additional options.
 * @param opts.cssPixels If true, adjust the composite size to account for zoom.
 * For example, when zoomed out, the size will be larger.
 * @returns A size object containing `width` and `height` integers.
 */
export function useCompositeScreenSize(opts?: { cssPixels?: boolean }): ISize {
  const compositeGeometry: IGeometry = {
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  };

  const screens = useSelector((state: RootState) => state.screens);
  for (const screen of screens) {
    compositeGeometry.x = Math.min(compositeGeometry.x, screen.x);
    compositeGeometry.y = Math.min(compositeGeometry.y, screen.y);
    compositeGeometry.width = Math.max(compositeGeometry.width, screen.x + screen.width);
    compositeGeometry.height = Math.max(compositeGeometry.height, screen.y + screen.height);
  }

  const size: ISize = {
    width: compositeGeometry.width - compositeGeometry.x,
    height: compositeGeometry.height - compositeGeometry.y,
  };

  if (opts?.cssPixels) {
    const zoomRatio = window.devicePixelRatio;
    if (zoomRatio !== 1) {
      size.width = Math.ceil(size.width * (1 / zoomRatio));
      size.height = Math.ceil(size.height * (1 / zoomRatio));
    }
  }

  return size;
}
