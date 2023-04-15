import { IWindow } from "./window";
import { anyIntersect } from "./utils";
import { SharedRootState } from "./redux/basicStore";
import { LayoutPluginInstance } from "./plugins";
import { getLayoutPluginName } from "./layouts";

export function selectAllWindows(state: SharedRootState): IWindow[] {
  const wins = [];
  for (const widStr in state.windows) {
    wins.push(state.windows[widStr]);
  }
  return wins;
}

export function selectWindowsFromScreen(state: SharedRootState, screenIndex: number): IWindow[] {
  const wins = [];
  for (const widStr in state.windows) {
    const win = state.windows[widStr];
    if (win.screenIndex !== screenIndex) {
      continue;
    }
    wins.push(win);
  }
  return wins;
}

export function selectWindowsFromCurrentTags(state: SharedRootState, screenIndex: number): IWindow[] {
  const currentTags = state.screens[screenIndex].currentTags;
  return selectWindowsFromScreen(state, screenIndex).filter((win) => {
    return anyIntersect(win.tags, currentTags);
  });
}

export function selectWindowsFromTag(state: SharedRootState, screenIndex: number, tag: string): IWindow[] {
  return selectWindowsFromScreen(state, screenIndex).filter((win) => win.tags.includes(tag));
}

export function selectVisibleWindowsFromCurrentTags(state: SharedRootState, screenIndex: number): IWindow[] {
  const currentTags = state.screens[screenIndex].currentTags;
  return selectWindowsFromScreen(state, screenIndex).filter((win) => {
    return win.visible && anyIntersect(win.tags, currentTags);
  });
}

export function selectCurrentLayoutForScreen(state: SharedRootState, screenIndex: number): string {
  const screen = state.screens[screenIndex];
  return screen.currentLayouts[screen.currentTags[0]];
}

export function selectWindowMaximizeCanTakeEffect(
  state: SharedRootState,
  layoutPlugins: LayoutPluginInstance[],
  wid: number
): boolean {
  const win = state.windows[wid];
  if (!win) {
    return false;
  }
  const currentLayoutName = selectCurrentLayoutForScreen(state, win.screenIndex);
  const currentLayout = layoutPlugins.find((plugin) => getLayoutPluginName(plugin) === currentLayoutName);
  if (currentLayout) {
    return currentLayout.exports.default.supportsMaximize;
  }
  return false;
}
