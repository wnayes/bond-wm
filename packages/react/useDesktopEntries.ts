import { DesktopEntryMap } from "@bond-wm/shared";
import { RootState } from "@bond-wm/shared-renderer";
import { useSelector } from "react-redux";

/**
 * Returns full desktop entry data. Typically used for providing an application
 * launcher / start menu.
 */
export function useDesktopEntries(): DesktopEntryMap {
  return useSelector((state: RootState) => state.desktop.entries);
}

/**
 * Returns desktop entry data for entries that should appear as icons on the
 * desktop.
 */
export function useDesktopEntriesForDesktopIcons(): DesktopEntryMap {
  return useSelector((state: RootState) => state.desktop.desktopEntries);
}
