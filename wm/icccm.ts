import { XPropMode } from "../shared/X";
import { IXWMEventConsumer, XWMContext } from "./wm";
import { internAtomAsync } from "./xutils";

enum WMStateValue {
  WithdrawnState = 0,
  NormalState = 1,
  IconicState = 3,
}

export async function createICCCMEventConsumer({ X }: XWMContext): Promise<IXWMEventConsumer> {
  const atoms = {
    WM_STATE: await internAtomAsync(X, "WM_STATE"),
  };

  function updateWindowState(wid: number): void {
    const wmStateBuffer = Buffer.alloc(8);
    wmStateBuffer.writeUInt32LE(WMStateValue.NormalState, 0);
    wmStateBuffer.writeUInt32LE(0, 4); // icon

    X.ChangeProperty(XPropMode.Replace, wid, atoms.WM_STATE, atoms.WM_STATE, 32, wmStateBuffer);
  }

  function removeWindowState(wid: number): void {
    X.DeleteProperty(wid, atoms.WM_STATE);
  }

  return {
    onMapNotify(wid) {
      updateWindowState(wid);
    },

    onUnmapNotify(wid) {
      removeWindowState(wid);
    },
  };
}
