import {
  configureWindowAction,
  endDragAction,
  LayoutPluginConfig,
  setWindowIntoScreenAction,
  startDragAction,
  XWMWindowType,
} from "@electron-wm/shared";
import { IScreen } from "@electron-wm/shared";
import { selectWindowMaximizeCanTakeEffect } from "@electron-wm/shared";
import { Coords, IGeometry } from "@electron-wm/shared";
import { geometryArea, geometryIntersect } from "@electron-wm/shared";
import {
  getAbsoluteWindowGeometry,
  IWindow,
  newHeightForWindow,
  newWidthForWindow,
  ResizeDirection,
} from "@electron-wm/shared";
import { XCB_CURRENT_TIME, XCB_GRAB_MODE_ASYNC, XEventMask } from "@electron-wm/shared";
import { log, logError } from "./log";
import { IXWMEventConsumer, XWMContext } from "./wm";

export interface DragModule extends IXWMEventConsumer {
  startMove(wid: number, coords: Coords): void;
  startResize(wid: number, coords: Coords, direction: ResizeDirection): void;
  endMoveResize(wid: number): void;
}

export async function createDragModule(
  { X, store, getFrameIdFromWindowId, getWindowIdFromFrameId }: XWMContext,
  getLayoutPlugins: (screenIndex: number) => readonly LayoutPluginConfig[] | undefined
): Promise<DragModule> {
  function endMoveResize(wid: number): void {
    const state = store.getState();
    const win = state.windows[wid];
    if (!win || !win._dragState) {
      return;
    }

    log("Ending drag for " + wid);

    X.UngrabPointer(XCB_CURRENT_TIME);
    X.UngrabKeyboard(XCB_CURRENT_TIME);

    store.dispatch(endDragAction({ wid }));

    // The window may now be on a different screen visually, so we should update state to match.
    setWindowIntoBestScreen(state.screens, win);
  }

  function doGrabsForDrag(wid: number): void {
    const fid = getFrameIdFromWindowId(wid) ?? wid;
    X.GrabPointer(
      fid,
      false,
      XEventMask.PointerMotion | XEventMask.ButtonRelease,
      XCB_GRAB_MODE_ASYNC,
      XCB_GRAB_MODE_ASYNC,
      0, // None
      0, // None
      XCB_CURRENT_TIME,
      (err) => {
        if (err) {
          logError(err);
        }
      }
    );
    X.GrabKeyboard(fid, false, XCB_CURRENT_TIME, XCB_GRAB_MODE_ASYNC, XCB_GRAB_MODE_ASYNC);
  }

  function setWindowIntoBestScreen(screens: IScreen[], win: IWindow): void {
    const prevWinScreen = screens[win.screenIndex];
    const bestWinScreen = getBestScreenForWindow(screens, win);
    if (bestWinScreen && bestWinScreen !== prevWinScreen) {
      store.dispatch(setWindowIntoScreenAction({ wid: win.id, screenIndex: screens.indexOf(bestWinScreen) }));

      // The window coordinates need to be adjusted to be relative to the new screen.
      store.dispatch(
        configureWindowAction({
          wid: win.id,
          ...win.outer,
          x: prevWinScreen.x + win.outer.x - bestWinScreen.x,
          y: prevWinScreen.y + win.outer.y - bestWinScreen.y,
        })
      );
    }
  }

  function getBestScreenForWindow(screens: IScreen[], win: IWindow): IScreen | null {
    let bestScreen = null;
    let bestIntersectArea = Number.MIN_SAFE_INTEGER;

    const winAbsCoords = getAbsoluteWindowGeometry(screens[win.screenIndex], win);

    for (const screen of screens) {
      const intersect = geometryIntersect(screen, winAbsCoords);
      if (!intersect) {
        continue;
      }
      const intersectArea = geometryArea(intersect);
      if (intersectArea > bestIntersectArea) {
        bestIntersectArea = intersectArea;
        bestScreen = screen;
      }
    }
    return bestScreen;
  }

  return {
    startMove(wid, coords) {
      const state = store.getState();
      const win = store.getState().windows[wid];
      if (
        !win ||
        win._dragState ||
        (win.maximized && selectWindowMaximizeCanTakeEffect(state, getLayoutPlugins(win.screenIndex), wid)) ||
        win.fullscreen
      ) {
        return;
      }

      log("Starting drag for " + wid, coords);

      store.dispatch(startDragAction({ wid, coords, moving: true }));

      doGrabsForDrag(wid);
    },

    startResize(wid, coords, direction) {
      const state = store.getState();
      const win = store.getState().windows[wid];
      if (
        !win ||
        win._dragState ||
        (win.maximized && selectWindowMaximizeCanTakeEffect(state, getLayoutPlugins(win.screenIndex), wid)) ||
        win.fullscreen
      ) {
        log("Choosing to not start resize for " + wid, coords, ResizeDirection[direction]);
        return;
      }

      log("Starting resize for " + wid, coords, ResizeDirection[direction]);

      store.dispatch(startDragAction({ wid, coords, resize: direction }));

      doGrabsForDrag(wid);
    },

    endMoveResize,

    onPointerMotion({ wid, windowType, rootx, rooty }) {
      let fid;
      if (windowType === XWMWindowType.Frame) {
        fid = wid;
        wid = getWindowIdFromFrameId(fid)!;
      } else if (windowType === XWMWindowType.Client) {
        fid = getFrameIdFromWindowId(wid);
      }

      const win = store.getState().windows[wid];
      if (!win || !win._dragState || !win._dragState.startOuterSize || !win._dragState.startCoordinates) {
        return;
      }

      const { startOuterSize, startCoordinates } = win._dragState;
      const xDiff = rootx - startCoordinates[0];
      const yDiff = rooty - startCoordinates[1];

      function configureWindow(win: IWindow, newConfig: Partial<IGeometry>): void {
        store.dispatch(
          configureWindowAction({
            wid: win.id,
            ...startOuterSize,
            x: typeof newConfig.x === "number" ? newConfig.x : undefined,
            y: typeof newConfig.y === "number" ? newConfig.y : undefined,
            width: typeof newConfig.width === "number" ? newWidthForWindow(win, newConfig.width) : undefined,
            height: typeof newConfig.height === "number" ? newHeightForWindow(win, newConfig.height) : undefined,
          })
        );
      }

      if (win._dragState.moving) {
        configureWindow(win, {
          x: startOuterSize.x + xDiff,
          y: startOuterSize.y + yDiff,
        });
        return;
      }

      if (typeof win._dragState.resize === "number") {
        switch (win._dragState.resize) {
          case ResizeDirection.TopLeft:
            configureWindow(win, {
              x: startOuterSize.x + xDiff,
              y: startOuterSize.y + yDiff,
              width: startOuterSize.width - xDiff,
              height: startOuterSize.height - yDiff,
            });
            break;
          case ResizeDirection.Top:
            configureWindow(win, {
              y: startOuterSize.y + yDiff,
              height: startOuterSize.height - yDiff,
            });
            break;
          case ResizeDirection.TopRight:
            configureWindow(win, {
              y: startOuterSize.y + yDiff,
              width: startOuterSize.width + xDiff,
              height: startOuterSize.height - yDiff,
            });
            break;
          case ResizeDirection.Right:
            configureWindow(win, {
              width: startOuterSize.width + xDiff,
            });
            break;
          case ResizeDirection.BottomRight:
            configureWindow(win, {
              width: startOuterSize.width + xDiff,
              height: startOuterSize.height + yDiff,
            });
            break;
          case ResizeDirection.Bottom:
            configureWindow(win, {
              height: startOuterSize.height + yDiff,
            });
            break;
          case ResizeDirection.BottomLeft:
            configureWindow(win, {
              x: startOuterSize.x + xDiff,
              width: startOuterSize.width - xDiff,
              height: startOuterSize.height + yDiff,
            });
            break;
          case ResizeDirection.Left:
            configureWindow(win, {
              x: startOuterSize.x + xDiff,
              width: startOuterSize.width - xDiff,
            });
            break;
        }
      }
    },

    onButtonRelease({ wid, windowType }) {
      let fid;
      if (windowType === XWMWindowType.Frame) {
        fid = wid;
        wid = getWindowIdFromFrameId(fid)!;
      } else if (windowType === XWMWindowType.Client) {
        fid = getFrameIdFromWindowId(wid);
      }

      endMoveResize(wid);
    },

    onKeyPress({ wid, windowType }) {
      let fid;
      if (windowType === XWMWindowType.Frame) {
        fid = wid;
        wid = getWindowIdFromFrameId(fid)!;
      } else if (windowType === XWMWindowType.Client) {
        fid = getFrameIdFromWindowId(wid);
      }

      endMoveResize(wid);
      return false;
    },
  };
}
