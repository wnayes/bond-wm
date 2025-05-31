import { useSelector } from "react-redux";
import { RootState } from "@bond-wm/shared-renderer";
import { IScreen } from "@bond-wm/shared";

/** Hook that observes and returns the array of screens. */
export function useScreens(): readonly IScreen[] {
  return useSelector<RootState, readonly IScreen[]>((state) => state.screens);
}
