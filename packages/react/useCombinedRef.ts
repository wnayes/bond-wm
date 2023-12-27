import { Ref, useCallback } from "react";
import { callRef } from "./callRef";

/**
 * Hook that fuses two or more refs into a single ref.
 * @param refs One or more refs (ref functions or objects).
 * @returns Single ref that populates the given refs.
 */
export function useCombinedRef<T>(...refs: Ref<T>[]): Ref<T> {
  return useCallback((value: T) => {
    for (const ref of refs) {
      callRef(ref, value);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, refs);
}
