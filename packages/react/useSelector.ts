import { useSelector as useReactReduxSelector } from "react-redux";
import { RootState } from "@bond-wm/shared-renderer";

/**
 * A custom hook that wraps the `useSelector` hook from `react-redux` to provide
 * access to window manager state.
 *
 * @template T - The type of the selected state.
 * @param selector - A function that takes the application's `RootState` and returns
 * a specific piece of state of type `T`.
 * @returns The selected state of type `T`.
 */
export function useSelector<T>(selector: (state: RootState) => T): T {
  return useReactReduxSelector<RootState, T>(selector);
}
