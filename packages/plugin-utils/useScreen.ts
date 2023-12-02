import { useSelector } from "react-redux";
import { RootState } from "@electron-wm/renderer-shared";
import { IScreen } from "@electron-wm/shared";
import { useScreenIndex } from "./useScreenIndex";

export function useScreen(): IScreen {
  const screenIndex = useScreenIndex();
  return useSelector((state: RootState) => state.screens[screenIndex]);
}
