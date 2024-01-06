import { LayoutInfo, selectConfigWithOverrides } from "@bond-wm/shared";
import { RootState } from "@bond-wm/shared-renderer";
import { useSelector } from "react-redux";

export function useLayoutPlugins(screenIndex: number | undefined): readonly LayoutInfo[] {
  return useSelector((state: RootState) => selectConfigWithOverrides(state, screenIndex).layouts);
}
