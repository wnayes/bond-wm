import { IWindow } from "@electron-wm/shared";
import { createContext, useContext } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@electron-wm/renderer-shared";

export const WidContext = createContext<number | undefined>(undefined);

export function useWindow(): IWindow | null {
  const wid = useContext(WidContext);
  return useSelector((state: RootState) => (typeof wid === "number" ? state.windows[wid] : null));
}
