import { Ref, useCallback, useLayoutEffect, useRef, useState } from "react";

/**
 * Observes and returns the size of an element.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useElementSize(): [DOMRect | null, Ref<any>] {
  const elementRef = useRef<HTMLElement | null>(null);
  const observer = useRef<ResizeObserver | null>(null);
  const [size, setSize] = useState<DOMRect | null>(null);

  const refCallback = useCallback((element: HTMLElement | null) => {
    if (elementRef.current === element) {
      return;
    }
    elementRef.current = element;

    if (observer.current) {
      observer.current.disconnect();
      observer.current = null;
    }

    if (element) {
      observer.current = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const domRect = entry.target.getBoundingClientRect();
          setSize({
            bottom: domRect.bottom,
            top: domRect.top,
            height: domRect.height,
            width: domRect.width,
            left: domRect.left,
            right: domRect.right,
            x: domRect.x,
            y: domRect.y,
            toJSON: domRect.toJSON,
          });
        }
      });
      observer.current.observe(element);
    }
  }, []);

  useLayoutEffect(() => {
    return () => {
      if (observer.current) {
        observer.current.disconnect();
        observer.current = null;
      }
    };
  }, []);

  return [size, refCallback];
}
