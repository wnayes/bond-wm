import * as React from "react";
import { useCallback, useEffect, useRef } from "react";

/**
 * Div that covers the wallpaper and introduces some dimming in the evening.
 * This is something that should become a plugin someday, if plugins exist.
 */
export function Dimmer() {
  const divRef = useRef<HTMLDivElement>(null);

  const onRefreshDimmer = useCallback(() => {
    if (divRef.current) {
      divRef.current.style.opacity = calculateDimmerOpacity(new Date()) + "";
    }
  }, []);

  useEffect(() => {
    onRefreshDimmer();

    const timeout = setInterval(onRefreshDimmer, 300000);
    return () => clearInterval(timeout);
  }, [onRefreshDimmer]);

  return <div ref={divRef} className="dimmerDiv"></div>;
}

function calculateDimmerOpacity(currentDate: Date): number {
  const hour = currentDate.getHours();
  // If prior to 8am or after 8pm.
  if (hour < 8 || hour > 19) {
    return 0.5;
  }
  return 0;
}
