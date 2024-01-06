import { DesktopEntryMap } from "@bond-wm/shared";
import { RootState } from "@bond-wm/shared-renderer";
import { useSelector } from "react-redux";

/** Returns desktop entry data. Typically used by the desktop icon display. */
export function useDesktopEntries(): DesktopEntryMap {
  return useSelector((state: RootState) => state.desktop.entries);
}
