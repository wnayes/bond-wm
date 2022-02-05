import { configureWindowAction, endDragAction, startDragAction } from "../shared/redux/windowSlice";
import { Coords } from "../shared/types";
import { XCB_GRAB_MODE_ASYNC, XEventMask } from "../shared/X";
import { log, logError } from "./log";
import { IXWMEventConsumer, XWMContext, XWMWindowType } from "./wm";

export interface DragModule extends IXWMEventConsumer {
  startMove(wid: number, coords: Coords): void;
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

    X.UngrabPointer(0);
  }

  return {
    startMove(wid, coords) {
      const win = store.getState().windows[wid];
      if (!win || win.dragState) {
        return;
      }

      log("Starting drag for " + wid, coords);

      store.dispatch(startDragAction({ wid, moving: true, coords }));

      const fid = getFrameIdFromWindowId(wid) ?? wid;
      X.GrabPointer(
        fid,
        false,
        XEventMask.PointerMotion | XEventMask.ButtonRelease,
        XCB_GRAB_MODE_ASYNC,
        XCB_GRAB_MODE_ASYNC, // async
        0, // None
        0, // None
        0,
        (err) => {
          if (err) {
            logError(err);
          }
        }
      );
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

      const startCoordinates = win.dragState.startCoordinates.slice();
      const xDiff = rootx - startCoordinates[0];
      const yDiff = rooty - startCoordinates[1];

      const startOuterSize = win.dragState.startOuterSize;
      const newGeo = { ...startOuterSize, x: startOuterSize.x + xDiff, y: startOuterSize.y + yDiff };

      store.dispatch(configureWindowAction({ wid, ...newGeo }));
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
  };
}
