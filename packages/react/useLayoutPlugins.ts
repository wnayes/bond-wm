import { LayoutInfo, selectConfigWithOverrides } from "@electron-wm/shared";
import { RootState } from "@electron-wm/shared-renderer";
import { useSelector } from "react-redux";

export function useLayoutPlugins(screenIndex: number | undefined): readonly LayoutInfo[] {
  return useSelector((state: RootState) => selectConfigWithOverrides(state, screenIndex).layouts);
}
