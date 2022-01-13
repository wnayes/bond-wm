import { IWindow } from "../shared/reducers";
import { anyIntersect } from "../shared/utils";
import { RootState } from "./configureStore";

export function selectWindowsFromScreen(state: RootState, screenIndex: number): IWindow[] {
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

export function selectRelevantWindows(state: RootState, screenIndex: number): IWindow[] {
  const currentTags = state.screens[screenIndex].currentTags;
  return selectWindowsFromScreen(state, screenIndex).filter((win) => {
    return anyIntersect(win.tags, currentTags);
  });
}
