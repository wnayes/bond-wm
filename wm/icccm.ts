import { IXClient, XPropMode } from "../shared/X";
import { log } from "./log";
import { IXWMEventConsumer, XWMContext, XWMWindowType } from "./wm";
import { getRawPropertyValue, internAtomAsync } from "./xutils";

enum WMStateValue {
  WithdrawnState = 0,
  NormalState = 1,
  IconicState = 3,
}

export interface WMSizeHints {
  flags: WMSizeHintsFlags;
  // x, y, width, height - deprecated?
  minWidth: number | undefined;
  minHeight: number | undefined;
  maxWidth: number | undefined;
  maxHeight: number | undefined;
  widthIncrement: number | undefined;
  heightIncrement: number | undefined;
  minAspect: [number, number] | undefined;
  maxAspect: [number, number] | undefined;
  baseWidth: number | undefined;
  baseHeight: number;
  gravity: unknown;
}

const SIZEOF_WMSizeHints = 72;

enum WMSizeHintsFlags {
  /** User-specified x, y */
  USPosition = 1,
  /** User-specified width, height */
  USSize = 2,
  /** Program-specified position */
  PPosition = 4,
  /** Program-specified size */
  PSize = 8,
  /** Program-specified minimum size */
  PMinSize = 16,
  /** Program-specified maximum size */
  PMaxSize = 32,
  /** Program-specified resize increments */
  PResizeInc = 64,
  /** Program-specified min and max aspect ratios */
  PAspect = 128,
  /** Program-specified base size */
  PBaseSize = 256,
  /** Program-specified window gravity */
  PWinGravity = 512,
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
    X.DeleteProperty(wid, atoms.WM_STATE, (err) => {
      if (err) {
        log("Could not delete WM_STATE");
      }
    });
  }

  return {
    onMapNotify({ wid, windowType }) {
      if (windowType === XWMWindowType.Client) {
        updateWindowState(wid);
      }
    },

    onUnmapNotify({ wid, windowType }) {
      if (windowType === XWMWindowType.Client) {
        removeWindowState(wid);
      }
    },
  };
}

export async function getNormalHints(X: IXClient, wid: number): Promise<WMSizeHints | undefined> {
  const { data } = await getRawPropertyValue(X, wid, X.atoms.WM_NORMAL_HINTS, X.atoms.WM_SIZE_HINTS);

  if (!data || data.length < SIZEOF_WMSizeHints) {
    return;
  }

  const hints: WMSizeHints = {
    flags: data.readInt32LE(0),
    minWidth: data.readInt32LE(20),
    minHeight: data.readInt32LE(24),
    maxWidth: data.readInt32LE(28),
    maxHeight: data.readInt32LE(32),
    widthIncrement: data.readInt32LE(36),
    heightIncrement: data.readInt32LE(40),
    minAspect: [data.readInt32LE(44), data.readInt32LE(48)],
    maxAspect: [data.readInt32LE(52), data.readInt32LE(56)],
    baseWidth: data.readInt32LE(60),
    baseHeight: data.readInt32LE(64),
    gravity: data.readInt32LE(68),
  };
  return hints;
}
