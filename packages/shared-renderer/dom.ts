/**
 * Like getBoundingClientRect, but values are converted to screen pixel size.
 */
export function getBoundingClientRectWithZoom(el: HTMLElement): DOMRect {
  const rect = el.getBoundingClientRect();
  const zoomRatio = window.devicePixelRatio;
  return {
    top: Math.round(rect.top * zoomRatio),
    bottom: Math.round(rect.bottom * zoomRatio),
    left: Math.round(rect.left * zoomRatio),
    right: Math.round(rect.right * zoomRatio),
    width: Math.round(rect.width * zoomRatio),
    height: Math.round(rect.height * zoomRatio),
    x: Math.round(rect.x * zoomRatio),
    y: Math.round(rect.y * zoomRatio),
    toJSON: () => {
      throw new Error("Not implemented");
    },
  };
}
