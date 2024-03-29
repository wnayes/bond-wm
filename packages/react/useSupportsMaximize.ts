import { useSelector } from "react-redux";
import { IWindow, selectWindowMaximizeCanTakeEffect } from "@bond-wm/shared";
import { RootState } from "@bond-wm/shared-renderer";
import { useLayoutPlugins } from "./useLayoutPlugins";

export function useSupportsMaximize(win: IWindow | null): boolean {
  const layouts = useLayoutPlugins(win?.screenIndex);
  return useSelector((state: RootState) => {
    if (!win) {
      return false;
    }
    return selectWindowMaximizeCanTakeEffect(state, layouts, win.id);
  });
}
