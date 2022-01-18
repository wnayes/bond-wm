import { setWindowFullscreenAction } from "../shared/redux/windowSlice";
import { Atom, XPropMode } from "../shared/X";
import { log } from "./log";
import { IXWMEventConsumer, XWMContext, XWMWindowType } from "./wm";
import { internAtomAsync } from "./xutils";

enum NetWmStateAction {
  _NET_WM_STATE_REMOVE = 0,
  _NET_WM_STATE_ADD = 1,
  _NET_WM_STATE_TOGGLE = 2,
}

export async function createEWMHEventConsumer({ X, store }: XWMContext): Promise<IXWMEventConsumer> {
  const ewmhAtoms = {
    _NET_WM_STATE: await internAtomAsync(X, "_NET_WM_STATE"),
    _NET_WM_STATE_FULLSCREEN: await internAtomAsync(X, "_NET_WM_STATE_FULLSCREEN"),

    _NET_FRAME_EXTENTS: await internAtomAsync(X, "_NET_FRAME_EXTENTS"),
  };

  function updateWindowStateHints(wid: number): void {
    const win = store.getState().windows[wid];
    if (!win) {
      return;
    }

    const hintAtoms: number[] = [];
    if (win.fullscreen) {
      hintAtoms.push(ewmhAtoms._NET_WM_STATE_FULLSCREEN);
    }

    const hintAtomsBuffer = Buffer.alloc(hintAtoms.length * 4);
    for (let i = 0; i < hintAtoms.length; i++) {
      hintAtomsBuffer.writeInt32LE(hintAtoms[i], i * 4);
    }

    X.ChangeProperty(XPropMode.Replace, wid, ewmhAtoms._NET_WM_STATE, X.atoms.ATOM, 32, hintAtomsBuffer);
  }

  function removeWindowStateHints(wid: number): void {
    X.DeleteProperty(wid, ewmhAtoms._NET_WM_STATE, (err) => {
      if (err) {
        log("Could not delete _NET_WM_STATE");
      }
    });
  }

  type NetWmStateData = [action: NetWmStateAction, firstAtom: Atom, secondAtom: Atom, sourceIndication: number];

  function processWindowStateChange(wid: number, action: NetWmStateAction, atom: Atom): void {
    switch (atom) {
      case ewmhAtoms._NET_WM_STATE_FULLSCREEN:
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
    onClientMessage({ wid, windowType, messageType, data }) {
      if (windowType === XWMWindowType.Client) {
        switch (messageType) {
          case ewmhAtoms._NET_WM_STATE:
            {
              const stateData = data as NetWmStateData;
              processWindowStateChange(wid, stateData[0], stateData[1]);
              if (stateData[2] !== 0) {
                processWindowStateChange(wid, stateData[0], stateData[2]);
              }
            }
            break;
        }
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

      X.ChangeProperty(XPropMode.Replace, wid, ewmhAtoms._NET_FRAME_EXTENTS, X.atoms.CARDINAL, 32, extentsInts);
    },
  };
}
