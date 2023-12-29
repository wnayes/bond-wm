import { XWMWindowType, setWindowFullscreenAction } from "@electron-wm/shared";
import { numsToBuffer } from "@electron-wm/shared";
import { Atom, XCB_COPY_FROM_PARENT, XPropMode } from "@electron-wm/shared";
import { log, logError } from "./log";
import { IXWMEventConsumer, XWMContext } from "./wm";
import { getRawPropertyValue, internAtomAsync } from "./xutils";
import { pid } from "process";
import { DragModule } from "./drag";
import { Coords } from "@electron-wm/shared";
import { IIconInfo, ResizeDirection } from "@electron-wm/shared";

enum NetWmStateAction {
  _NET_WM_STATE_REMOVE = 0,
  _NET_WM_STATE_ADD = 1,
  _NET_WM_STATE_TOGGLE = 2,
}

type NetWmStateData = [action: NetWmStateAction, firstAtom: Atom, secondAtom: Atom, sourceIndication: number];

type NetWmMoveResizeData = [
  xRoot: number,
  yRoot: number,
  direction: NetWmMoveResizeType,
  button: number,
  sourceIndication: number,
];

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

function netWMMoveResizeTypeToInternal(newWmMoveResizeType: NetWmMoveResizeType): ResizeDirection {
  switch (newWmMoveResizeType) {
    case NetWmMoveResizeType._NET_WM_MOVERESIZE_SIZE_TOPLEFT:
      return ResizeDirection.TopLeft;
    case NetWmMoveResizeType._NET_WM_MOVERESIZE_SIZE_TOP:
      return ResizeDirection.Top;
    case NetWmMoveResizeType._NET_WM_MOVERESIZE_SIZE_TOPRIGHT:
      return ResizeDirection.TopRight;
    case NetWmMoveResizeType._NET_WM_MOVERESIZE_SIZE_RIGHT:
      return ResizeDirection.Right;
    case NetWmMoveResizeType._NET_WM_MOVERESIZE_SIZE_BOTTOMRIGHT:
      return ResizeDirection.BottomRight;
    case NetWmMoveResizeType._NET_WM_MOVERESIZE_SIZE_BOTTOM:
      return ResizeDirection.Bottom;
    case NetWmMoveResizeType._NET_WM_MOVERESIZE_SIZE_BOTTOMLEFT:
      return ResizeDirection.BottomLeft;
    case NetWmMoveResizeType._NET_WM_MOVERESIZE_SIZE_LEFT:
      return ResizeDirection.Left;
    default:
      throw new Error("Unexpected resize type");
  }
}

export interface EWMHModule extends IXWMEventConsumer {
  getNetWmIcons(wid: number): Promise<IIconInfo[]>;
}

export async function createEWMHEventConsumer(
  { X, store, getWindowIdFromFrameId }: XWMContext,
  dragModule: DragModule
): Promise<EWMHModule> {
  const atoms = {
    _NET_SUPPORTED: await internAtomAsync(X, "_NET_SUPPORTED"),
    _NET_SUPPORTING_WM_CHECK: await internAtomAsync(X, "_NET_SUPPORTING_WM_CHECK"),

    _NET_WM_NAME: await internAtomAsync(X, "_NET_WM_NAME"),

    _NET_WM_ICON: await internAtomAsync(X, "_NET_WM_ICON"),

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
          atoms._NET_WM_ICON,
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
              const trueWid = getWindowIdFromFrameId(wid);
              if (typeof trueWid === "number") {
                wid = trueWid;
              }
            }

            const moveResizeData = data as NetWmMoveResizeData;
            if (moveResizeData[2] === NetWmMoveResizeType._NET_WM_MOVERESIZE_CANCEL) {
              dragModule.endMoveResize(wid);
              break;
            }

            const coords: Coords = [moveResizeData[0], moveResizeData[1]];

            switch (moveResizeData[2]) {
              case NetWmMoveResizeType._NET_WM_MOVERESIZE_MOVE:
                dragModule.startMove(wid, coords);
                break;

              case NetWmMoveResizeType._NET_WM_MOVERESIZE_SIZE_TOPLEFT:
              case NetWmMoveResizeType._NET_WM_MOVERESIZE_SIZE_TOP:
              case NetWmMoveResizeType._NET_WM_MOVERESIZE_SIZE_TOPRIGHT:
              case NetWmMoveResizeType._NET_WM_MOVERESIZE_SIZE_RIGHT:
              case NetWmMoveResizeType._NET_WM_MOVERESIZE_SIZE_BOTTOMRIGHT:
              case NetWmMoveResizeType._NET_WM_MOVERESIZE_SIZE_BOTTOM:
              case NetWmMoveResizeType._NET_WM_MOVERESIZE_SIZE_BOTTOMLEFT:
              case NetWmMoveResizeType._NET_WM_MOVERESIZE_SIZE_LEFT:
                dragModule.startResize(wid, coords, netWMMoveResizeTypeToInternal(moveResizeData[2]));
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

    async getNetWmIcons(wid: number): Promise<IIconInfo[]> {
      const { data } = await getRawPropertyValue(X, wid, atoms._NET_WM_ICON, X.atoms.CARDINAL);
      if (!data) {
        return [];
      }

      const icons: IIconInfo[] = [];
      const dataLength = data.byteLength;
      let i = 0;
      while (i < dataLength) {
        const info: IIconInfo = {
          width: data.readInt32LE(i),
          height: data.readInt32LE(i + 4),
          data: [],
        };
        i += 8;
        for (let j = 0; j < info.width * info.height; j++) {
          if (i >= dataLength) {
            logError("Icon data truncated for " + wid);
            break;
          }

          info.data.push(data.readUint32LE(i));
          i += 4;
        }

        icons.push(info);
      }

      return icons;
    },
  };
}
