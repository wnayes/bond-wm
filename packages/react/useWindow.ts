import { IWindow } from "@electron-wm/shared";
import { createContext, useContext } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@electron-wm/renderer-shared";

export const WidContext = createContext<number | undefined>(undefined);

/**
 * Provides the current window.
 * This only works in frame windows, which have the concept of single associated window.
 * It can return null for "pre-allocated" frame windows.
 */
export function useWindow(): IWindow | null {
  const wid = useContext(WidContext);
  return useSelector((state: RootState) => (typeof wid === "number" ? state.windows[wid] : null));
}
