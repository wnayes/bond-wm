import * as React from "react";
import { FallbackProps } from "react-error-boundary";

/** Error boundary fallback component. */
export function ErrorDisplay(props: FallbackProps) {
  return (
    <div className="errorDisplay">
      An error has occurred.
      <br />
      <br />
      {props.error?.toString()}
    </div>
  );
}
