import { IWindow } from "./window";
import { anyIntersect } from "./utils";
import { SharedRootState } from "./redux/basicStore";

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
