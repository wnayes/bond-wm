import { batch } from "react-redux";
import { LayoutPluginConfig } from "./plugins";
import { SharedStore } from "./redux/basicStore";
import { setTagCurrentLayoutAction } from "./redux/screenSlice";
import { setWindowPositionAction } from "./redux/windowSlice";
import { selectWindowsFromTag } from "./selectors";
import { WindowPosition } from "./window";

export function switchToNextLayout(store: SharedStore, layouts: LayoutPluginConfig[], screenIndex: number): void {
  const state = store.getState();
  const screen = state.screens[screenIndex];
  batch(() => {
    for (const tag of screen.currentTags) {
      const nextLayout = getNextLayout(layouts, screen.currentLayouts[tag]);
      if (nextLayout && nextLayout.name !== screen.currentLayouts[tag]) {
        store.dispatch(
          setTagCurrentLayoutAction({
            screenIndex,
            tag,
            layoutName: nextLayout.name,
          })
        );

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

function getNextLayout(layouts: LayoutPluginConfig[], fromLayoutName: string): LayoutPluginConfig {
  const currentIndex = layouts.findIndex((layout) => layout.name === fromLayoutName);
  const nextIndex = (currentIndex + 1) % layouts.length;
  return layouts[nextIndex];
}
