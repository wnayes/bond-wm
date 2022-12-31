import { getScreenIndex } from "../renderer-desktop/utils";
import { useSelector } from "react-redux";
import { RootState } from "@electron-wm/renderer-shared";
import { IScreen } from "@electron-wm/shared";

export function useScreen(): IScreen {
  const screenIndex = getScreenIndex();
  return useSelector((state: RootState) => state.screens[screenIndex]);
}
