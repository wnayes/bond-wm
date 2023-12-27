import { MutableRefObject, Ref } from "react";

/**
 * Populates a ref (function or object) with a given value.
 * @param ref Ref (function ref or object ref)
 * @param value Value to populate ref with.
 */
export function callRef<T>(ref: Ref<T>, value: T) {
  if (ref) {
    if ("current" in ref) {
      (ref as MutableRefObject<T>).current = value;
    } else {
      ref(value);
    }
  }
}
