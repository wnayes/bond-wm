import { batch } from "react-redux";
import { LayoutPluginInstance } from "./plugins";
import { SharedStore } from "./redux/basicStore";
import { setTagCurrentLayoutAction } from "./redux/screenSlice";
import { setWindowPositionAction } from "./redux/windowSlice";
import { selectWindowsFromTag } from "./selectors";
import {
  IWindow,
  WindowPosition,
  getWindowMaxHeight,
  getWindowMaxWidth,
  getWindowMinHeight,
  getWindowMinWidth,
} from "./window";
import { IGeometry } from "./types";
import { IScreen } from "./screen";

export function getLayoutPluginName(plugin: LayoutPluginInstance): string {
  return (plugin.settings?.name as string) || plugin.exports.default.name;
}

export function addLayoutResult(results: Map<number, IGeometry>, win: IWindow, screen: IScreen, pos: IGeometry): void {
  const minWidth = getWindowMinWidth(win);
  if (minWidth > 0) {
    pos.width = Math.min(pos.width, minWidth + win.frameExtents.left + win.frameExtents.right);
  }

  const maxWidth = getWindowMaxWidth(win);
  if (Number.isFinite(maxWidth)) {
    pos.width = Math.max(pos.width, maxWidth + win.frameExtents.left + win.frameExtents.right);
  }

  const minHeight = getWindowMinHeight(win);
  if (minHeight > 0) {
    pos.height = Math.min(pos.height, minHeight + win.frameExtents.top + win.frameExtents.bottom);
  }

  const maxHeight = getWindowMaxHeight(win);
  if (Number.isFinite(maxHeight)) {
    pos.height = Math.max(pos.height, maxHeight + win.frameExtents.top + win.frameExtents.bottom);
  }

  if (win.position !== WindowPosition.UserPositioned) {
    // Keep the windows within the screen.
    if (pos.x + pos.width > screen.width) {
      pos.x = screen.width - pos.width;
    }
    pos.x = Math.max(0, pos.x);

    if (pos.y + pos.height > screen.height) {
      pos.y = screen.height - pos.height;
    }
    pos.y = Math.max(0, pos.y);
  }

  results.set(win.id, pos);
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
