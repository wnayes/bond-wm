import { useSelector } from "react-redux";
import { RootState } from "@bond-wm/shared-renderer";
import { IScreen } from "@bond-wm/shared";
import { useScreenIndex } from "./useScreenIndex";

export function useScreen(): IScreen {
  const screenIndex = useScreenIndex();
  return useSelector((state: RootState) => state.screens[screenIndex]);
}
