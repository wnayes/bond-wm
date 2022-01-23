import * as React from "react";
import { useCallback, useEffect, useRef } from "react";

export function Clock() {
  const divRef = useRef<HTMLDivElement>();

  const onTimeRefresh = useCallback(() => {
    if (divRef.current) {
      divRef.current.textContent = getFormattedCurrentTime();
      divRef.current.title = getFormattedCurrentDate();
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(onTimeRefresh, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="clock" ref={divRef} title={getFormattedCurrentDate()}>
      {getFormattedCurrentTime()}
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

function getFormattedCurrentDate(): string {
  return new Date().toLocaleString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}
