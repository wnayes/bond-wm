import { useSelector } from "react-redux";
import { RootState } from "@bond-wm/shared-renderer";
import {
  IWindow,
  selectAllWindows,
  selectVisibleWindowsFromCurrentTags,
  selectWindowsFromCurrentTags,
  selectWindowsFromScreen,
} from "@bond-wm/shared";
import { useScreenIndex } from "./useScreenIndex";

export interface IUseWindowsProps {
  currentScreenOnly?: boolean;
  currentTagsOnly?: boolean;
  visibleOnly?: boolean;
}

/** Returns windows from state. */
export function useWindows(props?: IUseWindowsProps): readonly IWindow[] {
  const currentScreenOnly = props?.currentTagsOnly ?? true;
  const currentTagsOnly = props?.currentTagsOnly ?? true;
  const visibleOnly = props?.visibleOnly ?? true;

  const screenIndex = useScreenIndex();
  return useSelector((state: RootState) => {
    if (currentScreenOnly) {
      if (currentTagsOnly) {
        if (visibleOnly) {
          return selectVisibleWindowsFromCurrentTags(state, screenIndex);
        } else {
          return selectWindowsFromCurrentTags(state, screenIndex);
        }
      } else {
        if (visibleOnly) {
          throw new Error("Unsupported useWindows props");
        }
        return selectWindowsFromScreen(state, screenIndex);
      }
    } else {
      if (currentTagsOnly || visibleOnly) {
        throw new Error("Unsupported useWindows props");
      }
      return selectAllWindows(state);
    }
  });
}
