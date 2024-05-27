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

export interface ILayoutFunctionProps {
  windows: readonly IWindow[];
  screen: IScreen;
}

export interface LayoutFunction {
  (props: ILayoutFunctionProps): Map<number, IGeometry>;
}

/** Basic (serializable) info about a layout. */
export interface LayoutInfo {
  name: string;
  icon: string;
  supportsMaximize: boolean;
}

/** Plugin configuration object exported by layout plugin modules. */
export interface LayoutPluginConfig extends LayoutInfo {
  fn: LayoutFunction;
}

export function cloneLayoutInfo(layoutInfo: LayoutInfo): LayoutInfo {
  return {
    name: layoutInfo.name,
    icon: layoutInfo.icon,
    supportsMaximize: layoutInfo.supportsMaximize,
  };
}

export function getLayoutPluginName(plugin: LayoutInfo): string {
  return plugin.name;
}

export function addLayoutResult(results: Map<number, IGeometry>, win: IWindow, screen: IScreen, pos: IGeometry): void {
  const minWidth = getWindowMinWidth(win);
  if (minWidth > 0) {
    pos.width = Math.max(pos.width, minWidth + win.frameExtents.left + win.frameExtents.right);
  }

  const maxWidth = getWindowMaxWidth(win);
  if (Number.isFinite(maxWidth)) {
    pos.width = Math.min(pos.width, maxWidth + win.frameExtents.left + win.frameExtents.right);
  }

  const minHeight = getWindowMinHeight(win);
  if (minHeight > 0) {
    pos.height = Math.max(pos.height, minHeight + win.frameExtents.top + win.frameExtents.bottom);
  }

  const maxHeight = getWindowMaxHeight(win);
  if (Number.isFinite(maxHeight)) {
    pos.height = Math.min(pos.height, maxHeight + win.frameExtents.top + win.frameExtents.bottom);
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
  layoutPlugins: readonly LayoutInfo[],
  screenIndex: number
): void {
  const state = store.getState();
  const screen = state.screens[screenIndex];
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
}

function getNextLayout<TLayoutInfo extends LayoutInfo>(
  layoutPlugins: readonly TLayoutInfo[],
  fromLayoutName: string
): TLayoutInfo {
  const currentIndex = layoutPlugins.findIndex((layout) => getLayoutPluginName(layout) === fromLayoutName);
  const nextIndex = (currentIndex + 1) % layoutPlugins.length;
  return layoutPlugins[nextIndex];
}
