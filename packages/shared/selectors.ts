import { IWindow, getWindowMaxHeight, getWindowMaxWidth } from "./window";
import { anyIntersect } from "./utils";
import { SharedRootState } from "./redux/basicStore";
import { LayoutInfo, getLayoutPluginName } from "./layouts";
import { ISerializableConfig, assignConfig } from "./config";
import { IScreen } from "./screen";

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

export function selectScreenForWindow(state: SharedRootState, wid: number): IScreen | null {
  const win = state.windows[wid];
  return state.screens[win?.screenIndex] ?? null;
}

export function selectCurrentLayoutForScreen(state: SharedRootState, screenIndex: number): string {
  const screen = state.screens[screenIndex];
  return screen.currentLayouts[screen.currentTags[0]];
}

export function selectWindowMaximizeCanTakeEffect(
  state: SharedRootState,
  layoutInfo: readonly LayoutInfo[] | undefined,
  wid: number
): boolean {
  const win = state.windows[wid];
  if (!win) {
    return false;
  }

  // Is the window constrained by max size?
  const maxWidth = getWindowMaxWidth(win);
  const maxHeight = getWindowMaxHeight(win);
  const screen = selectScreenForWindow(state, wid);
  if (screen && (screen.width > maxWidth || screen.height > maxHeight)) {
    return false;
  }

  const currentLayoutName = selectCurrentLayoutForScreen(state, win.screenIndex);
  const currentLayout = layoutInfo?.find((plugin) => getLayoutPluginName(plugin) === currentLayoutName);
  if (currentLayout) {
    return currentLayout.supportsMaximize;
  }
  return false;
}

export function selectConfigWithOverrides(
  state: SharedRootState,
  screenIndex: number | null | undefined
): ISerializableConfig<LayoutInfo> {
  const config = { ...state.config.config };
  if (typeof screenIndex === "number") {
    const overrides = config.screenOverrides?.[screenIndex];
    if (overrides) {
      assignConfig(config, overrides);
    }
  }
  return config;
}
