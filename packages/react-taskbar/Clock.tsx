import React from "react";
import { useCallback, useEffect, useRef } from "react";

/** A taskbar clock for bond-wm. */
export function Clock() {
  const divRef = useRef<HTMLDivElement>(null);
  const timeSpanRef = useRef<HTMLSpanElement>(null);
  const dateSpanRef = useRef<HTMLSpanElement>(null);

  const onTimeRefresh = useCallback(() => {
    if (divRef.current) {
      divRef.current.title = getFormattedCurrentDate();
    }
    if (timeSpanRef.current) {
      timeSpanRef.current.textContent = getFormattedCurrentTime();
    }
    if (dateSpanRef.current) {
      dateSpanRef.current.textContent = getFormattedSecondaryDate();
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(onTimeRefresh, 10000);
    return () => clearInterval(interval);
  }, [onTimeRefresh]);

  return (
    <div className="clock" ref={divRef} title={getFormattedCurrentDate()}>
      <span ref={dateSpanRef} className="clockDate">
        {getFormattedSecondaryDate()}
      </span>
      <span ref={timeSpanRef} className="clockTime">
        {getFormattedCurrentTime()}
      </span>
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

function getFormattedSecondaryDate(): string {
  return new Date().toLocaleString("en-US", {
    month: "numeric",
    day: "numeric",
  });
}
