import { IWindow } from "../shared/reducers";
import { anyIntersect } from "../shared/utils";
import { RootState } from "./configureStore";

export function selectRelevantWindows(state: RootState, screenIndex: number): IWindow[] {
    const currentTags = state.screens[screenIndex].currentTags;
    const wins = [];
    for (const widStr in state.windows) {
        const win = state.windows[widStr];
        if (anyIntersect(win.tags, currentTags)) {
        wins.push(win);
        }
    }
    return wins;
}