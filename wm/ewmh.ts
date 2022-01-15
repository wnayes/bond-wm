import { XPropMode } from "../shared/X";
import { log } from "./log";
import { IXWMEventConsumer, XWMContext, XWMWindowType } from "./wm";
import { internAtomAsync } from "./xutils";

export async function createEWMHEventConsumer({ X }: XWMContext): Promise<IXWMEventConsumer> {
  const ewmhAtoms = {
    _NET_WM_STATE: await internAtomAsync(X, "_NET_WM_STATE"),
    _NET_FRAME_EXTENTS: await internAtomAsync(X, "_NET_FRAME_EXTENTS"),
  };

  function updateWindowStateHints(wid: number): void {
    const hintAtoms = Buffer.alloc(0);

    // TODO: Populate hints based on window state.

    X.ChangeProperty(XPropMode.Replace, wid, ewmhAtoms._NET_WM_STATE, X.atoms.ATOM, 32, hintAtoms);
  }

  function removeWindowStateHints(wid: number): void {
    X.DeleteProperty(wid, ewmhAtoms._NET_WM_STATE, (err) => {
      if (err) {
        log("Could not delete _NET_WM_STATE");
      }
    });
  }

  return {
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
