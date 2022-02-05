import { setWindowFullscreenAction } from "../shared/redux/windowSlice";
import { numsToBuffer } from "../shared/utils";
import { Atom, XCB_COPY_FROM_PARENT, XPropMode } from "../shared/X";
import { log } from "./log";
import { IXWMEventConsumer, XWMContext, XWMWindowType } from "./wm";
import { internAtomAsync } from "./xutils";
import { pid } from "process";
import { DragModule } from "./drag";
import { Coords } from "../shared/types";

enum NetWmStateAction {
  _NET_WM_STATE_REMOVE = 0,
  _NET_WM_STATE_ADD = 1,
  _NET_WM_STATE_TOGGLE = 2,
}

type NetWmStateData = [action: NetWmStateAction, firstAtom: Atom, secondAtom: Atom, sourceIndication: number];

type NetWmMoveResizeData = [xRoot: number, yRoot: number, direction: number, button: number, sourceIndication: number];

enum NetWmMoveResizeType {
  _NET_WM_MOVERESIZE_SIZE_TOPLEFT = 0,
  _NET_WM_MOVERESIZE_SIZE_TOP = 1,
  _NET_WM_MOVERESIZE_SIZE_TOPRIGHT = 2,
  _NET_WM_MOVERESIZE_SIZE_RIGHT = 3,
  _NET_WM_MOVERESIZE_SIZE_BOTTOMRIGHT = 4,
  _NET_WM_MOVERESIZE_SIZE_BOTTOM = 5,
  _NET_WM_MOVERESIZE_SIZE_BOTTOMLEFT = 6,
  _NET_WM_MOVERESIZE_SIZE_LEFT = 7,
  _NET_WM_MOVERESIZE_MOVE = 8 /* movement only */,
  _NET_WM_MOVERESIZE_SIZE_KEYBOARD = 9 /* size via keyboard */,
  _NET_WM_MOVERESIZE_MOVE_KEYBOARD = 10 /* move via keyboard */,
  _NET_WM_MOVERESIZE_CANCEL = 11 /* cancel operation */,
}

export async function createEWMHEventConsumer(
  { X, store, getWindowIdFromFrameId }: XWMContext,
  dragModule: DragModule
): Promise<IXWMEventConsumer> {
  const atoms = {
    _NET_SUPPORTED: await internAtomAsync(X, "_NET_SUPPORTED"),
    _NET_SUPPORTING_WM_CHECK: await internAtomAsync(X, "_NET_SUPPORTING_WM_CHECK"),

    _NET_WM_NAME: await internAtomAsync(X, "_NET_WM_NAME"),

    _NET_WM_STATE: await internAtomAsync(X, "_NET_WM_STATE"),
    _NET_WM_STATE_FULLSCREEN: await internAtomAsync(X, "_NET_WM_STATE_FULLSCREEN"),

    _NET_FRAME_EXTENTS: await internAtomAsync(X, "_NET_FRAME_EXTENTS"),
    _NET_WM_PID: await internAtomAsync(X, "_NET_WM_PID"),
    _NET_WM_MOVERESIZE: await internAtomAsync(X, "_NET_WM_MOVERESIZE"),

    UTF8_STRING: await internAtomAsync(X, "UTF8_STRING"),
  };

  function updateWindowStateHints(wid: number): void {
    const win = store.getState().windows[wid];
    if (!win) {
      return;
    }

    const hintAtoms: number[] = [];
    if (win.fullscreen) {
      hintAtoms.push(atoms._NET_WM_STATE_FULLSCREEN);
    }

    X.ChangeProperty(XPropMode.Replace, wid, atoms._NET_WM_STATE, X.atoms.ATOM, 32, numsToBuffer(hintAtoms));
  }

  function removeWindowStateHints(wid: number): void {
    X.DeleteProperty(wid, atoms._NET_WM_STATE, (err) => {
      if (err) {
        log("Could not delete _NET_WM_STATE");
      }
    });
  }

  function processWindowStateChange(wid: number, action: NetWmStateAction, atom: Atom): void {
    switch (atom) {
      case atoms._NET_WM_STATE_FULLSCREEN:
        processWindowFullscreenChange(wid, action);
        updateWindowStateHints(wid);
        break;
    }
  }

  function processWindowFullscreenChange(wid: number, action: NetWmStateAction): void {
    const win = store.getState().windows[wid];
    if (!win) {
      return;
    }

    switch (action) {
      case NetWmStateAction._NET_WM_STATE_ADD:
        if (!win.fullscreen) {
          store.dispatch(setWindowFullscreenAction({ wid, fullscreen: true }));
        }
        break;

      case NetWmStateAction._NET_WM_STATE_REMOVE:
        if (win.fullscreen) {
          store.dispatch(setWindowFullscreenAction({ wid, fullscreen: false }));
        }
        break;

      case NetWmStateAction._NET_WM_STATE_TOGGLE:
        store.dispatch(setWindowFullscreenAction({ wid, fullscreen: !win.fullscreen }));
        break;
    }
  }

  return {
    onScreenCreated({ root }) {
      X.ChangeProperty(
        XPropMode.Replace,
        root,
        atoms._NET_SUPPORTED,
        X.atoms.ATOM,
        32,
        numsToBuffer([
          atoms._NET_SUPPORTED,
          atoms._NET_SUPPORTING_WM_CHECK,
          atoms._NET_WM_NAME,
          atoms._NET_WM_STATE,
          atoms._NET_WM_STATE_FULLSCREEN,
          atoms._NET_FRAME_EXTENTS,
          atoms._NET_WM_PID,
          atoms._NET_WM_MOVERESIZE,
        ])
      );

      // Part of the spec requires us to create a window and set some properties on it.
      const wid = X.AllocID();
      X.CreateWindow(wid, root, -1, -1, 1, 1, 0, XCB_COPY_FROM_PARENT, 0, 0);
      const widBuffer = numsToBuffer([wid]);
      X.ChangeProperty(XPropMode.Replace, root, atoms._NET_SUPPORTING_WM_CHECK, X.atoms.WINDOW, 32, widBuffer);
      X.ChangeProperty(XPropMode.Replace, wid, atoms._NET_SUPPORTING_WM_CHECK, X.atoms.WINDOW, 32, widBuffer);
      X.ChangeProperty(XPropMode.Replace, wid, atoms._NET_WM_NAME, atoms.UTF8_STRING, 8, "electron-wm");
      X.ChangeProperty(XPropMode.Replace, wid, atoms._NET_WM_PID, X.atoms.CARDINAL, 32, numsToBuffer([pid]));
    },

    onClientMessage({ wid, windowType, messageType, data }) {
      switch (messageType) {
        case atoms._NET_WM_STATE:
          {
            if (windowType === XWMWindowType.Client) {
              const stateData = data as NetWmStateData;
              processWindowStateChange(wid, stateData[0], stateData[1]);
              if (stateData[2] !== 0) {
                processWindowStateChange(wid, stateData[0], stateData[2]);
              }
            }
          }
          break;

        case atoms._NET_WM_MOVERESIZE:
          {
            if (windowType === XWMWindowType.Frame) {
              wid = getWindowIdFromFrameId(wid);
            }

            const moveResizeData = data as NetWmMoveResizeData;
            switch (moveResizeData[2]) {
              case NetWmMoveResizeType._NET_WM_MOVERESIZE_MOVE:
                {
                  const coords: Coords = [moveResizeData[0], moveResizeData[1]];
                  dragModule.startMove(wid, coords);
                }
                break;

              case NetWmMoveResizeType._NET_WM_MOVERESIZE_CANCEL:
                dragModule.endMoveResize(wid);
                break;

              default:
                break;
            }
          }
          break;
      }
    },

    onMapNotify({ wid, windowType }) {
      if (windowType === XWMWindowType.Client) {
        updateWindowStateHints(wid);
      }
    },

    onUnmapNotify({ wid, windowType }) {
      if (windowType === XWMWindowType.Client) {
        removeWindowStateHints(wid);
      }
    },

    onSetFrameExtents({ wid, frameExtents }) {
      const extentsInts = Buffer.alloc(16);
      extentsInts.writeInt32LE(frameExtents.left, 0);
      extentsInts.writeInt32LE(frameExtents.right, 4);
      extentsInts.writeInt32LE(frameExtents.top, 8);
      extentsInts.writeInt32LE(frameExtents.bottom, 12);

      X.ChangeProperty(XPropMode.Replace, wid, atoms._NET_FRAME_EXTENTS, X.atoms.CARDINAL, 32, extentsInts);
    },
  };
}
