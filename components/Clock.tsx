import * as React from "react";
import { useCallback, useEffect, useRef } from "react";

import moment from "moment";

export function Clock() {
  const divRef = useRef<HTMLDivElement>();

  const getTime = useCallback(() => moment().format("h:mm A"), []);

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
