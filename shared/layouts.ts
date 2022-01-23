import { batch } from "react-redux";
import { SharedStore } from "./redux/basicStore";
import { setTagCurrentLayoutAction } from "./redux/screenSlice";

const _layouts = ["Floating", "Tiling"];

export function getLayoutNames(): string[] {
  return _layouts;
}

export function getFirstLayoutName(): string {
  return _layouts[0];
}

export function getNextLayoutName(fromLayoutName: string): string {
  const currentIndex = _layouts.findIndex((layout) => layout === fromLayoutName);
  const nextIndex = (currentIndex + 1) % _layouts.length;
  return _layouts[nextIndex];
}

export function switchToNextLayout(store: SharedStore, screenIndex: number): void {
  const screens = store.getState().screens;
  const screen = screens[screenIndex];
  batch(() => {
    for (const tag of screen.currentTags) {
      const nextLayoutName = getNextLayoutName(screen.currentLayouts[tag]);
      if (nextLayoutName !== screen.currentLayouts[tag]) {
        store.dispatch(setTagCurrentLayoutAction({ screenIndex, tag, layoutName: nextLayoutName }));
      }
    }
  });
}
