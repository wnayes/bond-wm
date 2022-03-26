import { configureWindowAction, endDragAction, startDragAction } from "../shared/redux/windowSlice";
import { Coords, IGeometry } from "../shared/types";
import { IWindow, newHeightForWindow, newWidthForWindow, ResizeDirection } from "../shared/window";
import { XCB_CURRENT_TIME, XCB_GRAB_MODE_ASYNC, XEventMask } from "../shared/X";
import { log, logError } from "./log";
import { IXWMEventConsumer, XWMContext, XWMWindowType } from "./wm";

export interface DragModule extends IXWMEventConsumer {
  startMove(wid: number, coords: Coords): void;
  startResize(wid: number, coords: Coords, direction: ResizeDirection): void;
  endMoveResize(wid: number): void;
}

export async function createDragModule({
  X,
  store,
  getFrameIdFromWindowId,
  getWindowIdFromFrameId,
}: XWMContext): Promise<DragModule> {
  function endMoveResize(wid: number): void {
    const win = store.getState().windows[wid];
    if (!win || !win.dragState) {
      return;
    }

    log("Ending drag for " + wid);

    store.dispatch(endDragAction({ wid }));

    X.UngrabPointer(XCB_CURRENT_TIME);
    X.UngrabKeyboard(XCB_CURRENT_TIME);
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

  return {
    startMove(wid, coords) {
      const win = store.getState().windows[wid];
      if (!win || win.dragState) {
        return;
      }

      log("Starting drag for " + wid, coords);

      store.dispatch(startDragAction({ wid, coords, moving: true }));

      doGrabsForDrag(wid);
    },

    startResize(wid, coords, direction) {
      const win = store.getState().windows[wid];
      if (!win || win.dragState) {
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
        wid = getWindowIdFromFrameId(fid);
      } else if (windowType === XWMWindowType.Client) {
        fid = getFrameIdFromWindowId(wid);
      }

      const win = store.getState().windows[wid];
      if (!win || !win.dragState || !win.dragState.startOuterSize || !win.dragState.startCoordinates) {
        return;
      }

      const { startOuterSize, startCoordinates } = win.dragState;
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

      if (win.dragState.moving) {
        configureWindow(win, {
          x: startOuterSize.x + xDiff,
          y: startOuterSize.y + yDiff,
        });
        return;
      }

      if (typeof win.dragState.resize === "number") {
        switch (win.dragState.resize) {
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
        wid = getWindowIdFromFrameId(fid);
      } else if (windowType === XWMWindowType.Client) {
        fid = getFrameIdFromWindowId(wid);
      }

      endMoveResize(wid);
    },

    onKeyPress({ wid, windowType }) {
      let fid;
      if (windowType === XWMWindowType.Frame) {
        fid = wid;
        wid = getWindowIdFromFrameId(fid);
      } else if (windowType === XWMWindowType.Client) {
        fid = getFrameIdFromWindowId(wid);
      }

      endMoveResize(wid);
      return false;
    },
  };
}
