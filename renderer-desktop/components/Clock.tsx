import * as React from "react";
import { useCallback, useEffect, useRef } from "react";

export function Clock() {
  const divRef = useRef<HTMLDivElement>();

  const getTime = useCallback(() => getFormattedCurrentTime(), []);

  const onTimeRefresh = useCallback(() => {
    if (divRef.current) {
      divRef.current.textContent = getTime();
    }
  }, [getTime]);

  useEffect(() => {
    const interval = setInterval(onTimeRefresh, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="clock" ref={divRef}>
      {getTime()}
    </div>
  );
}

function getFormattedCurrentTime(): string {
  return new Date().toLocaleString("en-US", {
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  });
}
