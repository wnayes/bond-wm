import { batch } from "react-redux";
import { SharedStore } from "./redux/basicStore";
import { setTagCurrentLayoutAction } from "./redux/screenSlice";
import { setWindowPositionAction } from "./redux/windowSlice";
import { selectWindowsFromTag } from "./selectors";
import { WindowPosition } from "./window";

const _layouts = ["Floating", "Tiling"];

interface ILayoutMetadata {
  supportsMaximize: boolean;
}

const _layoutMetadata: { [layoutName: string]: ILayoutMetadata } = {
  Floating: {
    supportsMaximize: true,
  },
  Tiling: {
    supportsMaximize: false,
  },
};

export function getLayoutNames(): string[] {
  return _layouts;
}

export function getNextLayoutName(fromLayoutName: string): string {
  const currentIndex = _layouts.findIndex((layout) => layout === fromLayoutName);
  const nextIndex = (currentIndex + 1) % _layouts.length;
  return _layouts[nextIndex];
}

export function switchToNextLayout(store: SharedStore, screenIndex: number): void {
  const state = store.getState();
  const screen = state.screens[screenIndex];
  batch(() => {
    for (const tag of screen.currentTags) {
      const nextLayoutName = getNextLayoutName(screen.currentLayouts[tag]);
      if (nextLayoutName !== screen.currentLayouts[tag]) {
        store.dispatch(setTagCurrentLayoutAction({ screenIndex, tag, layoutName: nextLayoutName }));

        // Layout change resets any user positioned windows.
        for (const win of selectWindowsFromTag(state, screenIndex, tag)) {
          if (win.position === WindowPosition.UserPositioned) {
            store.dispatch(setWindowPositionAction({ wid: win.id, position: WindowPosition.Default }));
          }
        }
      }
    }
  });
}

export function layoutSupportsMaximize(layoutName: string): boolean {
  return _layoutMetadata[layoutName]?.supportsMaximize ?? false;
}
