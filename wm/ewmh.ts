import { XPropMode } from "../shared/X";
import { IXWMEventConsumer, XWMContext } from "./wm";
import { internAtomAsync } from "./xutils";

export async function createEWMHEventConsumer({ X }: XWMContext): Promise<IXWMEventConsumer> {
  const ewmhAtoms = {
    _NET_WM_STATE: await internAtomAsync(X, "_NET_WM_STATE"),
  };

  function updateWindowStateHints(wid: number): void {
    const hintAtoms = Buffer.alloc(0);

    // TODO: Populate hints based on window state.

    X.ChangeProperty(XPropMode.Replace, wid, ewmhAtoms._NET_WM_STATE, X.atoms.ATOM, 32, hintAtoms);
  }

  function removeWindowStateHints(wid: number): void {
    X.DeleteProperty(wid, ewmhAtoms._NET_WM_STATE);
  }

  return {
    onMapNotify(wid) {
      updateWindowStateHints(wid);
    },

    onUnmapNotify(wid) {
      removeWindowStateHints(wid);
    },
  };
}
