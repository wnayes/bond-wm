import { batch } from "react-redux";
import { LayoutPluginInstance } from "./plugins";
import { SharedStore } from "./redux/basicStore";
import { setTagCurrentLayoutAction } from "./redux/screenSlice";
import { setWindowPositionAction } from "./redux/windowSlice";
import { selectWindowsFromTag } from "./selectors";
import { WindowPosition } from "./window";

export function getLayoutPluginName(plugin: LayoutPluginInstance): string {
  return (plugin.settings?.name as string) || plugin.exports.default.name;
}

export function switchToNextLayout(
  store: SharedStore,
  layoutPlugins: LayoutPluginInstance[],
  screenIndex: number
): void {
  const state = store.getState();
  const screen = state.screens[screenIndex];
  batch(() => {
    for (const tag of screen.currentTags) {
      const nextLayout = getNextLayout(layoutPlugins, screen.currentLayouts[tag]);
      if (nextLayout && getLayoutPluginName(nextLayout) !== screen.currentLayouts[tag]) {
        store.dispatch(
          setTagCurrentLayoutAction({
            screenIndex,
            tag,
            layoutName: getLayoutPluginName(nextLayout),
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

function getNextLayout(layoutPlugins: LayoutPluginInstance[], fromLayoutName: string): LayoutPluginInstance {
  const currentIndex = layoutPlugins.findIndex((layout) => getLayoutPluginName(layout) === fromLayoutName);
  const nextIndex = (currentIndex + 1) % layoutPlugins.length;
  return layoutPlugins[nextIndex];
}
