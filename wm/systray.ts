import { addTrayWindowAction, configureTrayWindowAction, removeTrayWindowAction } from "../shared/redux/traySlice";
import { IGeometry } from "../shared/types";
import { numsToBuffer } from "../shared/utils";
import { IX11Mod, X11_EVENT_TYPE, XCB_COPY_FROM_PARENT, XPropMode } from "../shared/X";
import { log } from "./log";
import { IXWMEventConsumer, XWMContext } from "./wm";
import { changeWindowEventMask, internAtomAsync } from "./xutils";
const x11: IX11Mod = require("x11"); // eslint-disable-line

enum SystemTrayOps {
  SYSTEM_TRAY_REQUEST_DOCK = 0,
  SYSTEM_TRAY_BEGIN_MESSAGE = 1,
  SYSTEM_TRAY_CANCEL_MESSAGE = 2,
}

enum SystemTrayOrientation {
  _NET_SYSTEM_TRAY_ORIENTATION_HORZ = 0,
  _NET_SYSTEM_TRAY_ORIENTATION_VERT = 1,
}

const TRAY_OWNER_EVENT_MASK = x11.eventMask.SubstructureRedirect;

const TRAY_WIN_EVENT_MASK = x11.eventMask.StructureNotify | x11.eventMask.PropertyChange | x11.eventMask.EnterWindow;

/**
 * System tray implementation.
 * https://specifications.freedesktop.org/systemtray-spec/systemtray-spec-0.2.html
 */
export async function createTrayEventConsumer({ X, store, XDisplay }: XWMContext): Promise<IXWMEventConsumer> {
  const TraySelectionAtom = `_NET_SYSTEM_TRAY_S${X.screenNum}`;

  const atoms = {
    MANAGER: await internAtomAsync(X, "MANAGER"),
    [TraySelectionAtom]: await internAtomAsync(X, TraySelectionAtom),
    _NET_SYSTEM_TRAY_OPCODE: await internAtomAsync(X, "_NET_SYSTEM_TRAY_OPCODE"),
    _NET_SYSTEM_TRAY_ORIENTATION: await internAtomAsync(X, "_NET_SYSTEM_TRAY_ORIENTATION"),
  };

  let _registered = false;
  let _trayOwnerWid = 0;
  let _trayDesktopWid = 0;

  function isTrayWin(win: number): boolean {
    return win in store.getState().tray.windows;
  }

  function dockTrayWindow(trayWid: number) {
    if (isTrayWin(trayWid)) {
      return;
    }

    store.dispatch(addTrayWindowAction({ wid: trayWid }));

    changeWindowEventMask(X, trayWid, TRAY_WIN_EVENT_MASK);

    // X.ChangeSaveSet(XCB_SET_MODE_INSERT, trayWid) ?
    //X.ReparentWindow(trayWid, _trayDesktopWid, 0, 0);

    X.ConfigureWindow(trayWid, { width: 16, height: 16 });
    X.MapWindow(trayWid);
  }

  return {
    onScreenCreated(args) {
      if (_registered) {
        return;
      }
      _registered = true;

      _trayOwnerWid = X.AllocID();
      X.CreateWindow(_trayOwnerWid, args.root, -1, -1, 1, 1, 0, XCB_COPY_FROM_PARENT, 0, 0, {
        backgroundPixel: XDisplay.screen[0].black_pixel,
      });

      changeWindowEventMask(X, _trayOwnerWid, TRAY_OWNER_EVENT_MASK);

      X.ChangeProperty(
        XPropMode.Replace,
        _trayOwnerWid,
        atoms._NET_SYSTEM_TRAY_ORIENTATION,
        X.atoms.INTEGER,
        32,
        numsToBuffer([SystemTrayOrientation._NET_SYSTEM_TRAY_ORIENTATION_HORZ])
      );

      _trayDesktopWid = args.desktopWindowId;
      const selection = atoms[TraySelectionAtom];

      const eventData = Buffer.alloc(32);
      eventData.writeUInt8(X11_EVENT_TYPE.ClientMessage, 0);
      eventData.writeUInt8(32, 1); // Format
      eventData.writeUInt32LE(args.root, 4); // Window ID
      eventData.writeUInt32LE(atoms.MANAGER, 8); // Message Type
      eventData.writeUInt32LE(0, 12); // data32[0] - timestamp ?
      eventData.writeUInt32LE(selection, 16); // data32[1] - manager selection atom
      eventData.writeUInt32LE(_trayOwnerWid, 20); // data32[2] - the window owning the selection
      eventData.writeUInt32LE(0, 24); // data32[3] - N/A
      eventData.writeUInt32LE(0, 28); // data32[4] - N/A

      X.SetSelectionOwner(_trayOwnerWid, selection);

      X.SendEvent(args.root, false, 0xffffff, eventData);
      log(`Registered ${_trayOwnerWid} as tray selection owner for ${TraySelectionAtom}.`);
    },

    onUnmapNotify(args) {
      if (isTrayWin(args.wid)) {
        store.dispatch(removeTrayWindowAction(args.wid));
      }
    },

    onClientMessage(args) {
      if (args.messageType === atoms._NET_SYSTEM_TRAY_OPCODE) {
        switch (args.data[1]) {
          case SystemTrayOps.SYSTEM_TRAY_REQUEST_DOCK:
            {
              const widToDock = args.data[2];
              log(`SYSTEM_TRAY_REQUEST_DOCK, widToDock=${widToDock}`);
              dockTrayWindow(widToDock);
            }
            break;

          default:
            log("Unhandled system tray op", args.data[1], SystemTrayOps[args.data[1]]);
            break;
        }
      }
    },

    onReduxAction(args) {
      switch (args.action.type) {
        case configureTrayWindowAction.type:
          {
            const state = args.getState();
            const payload = args.action.payload as Partial<IGeometry> & { wid: number };
            const wid = payload.wid;
            const win = state.tray.windows[wid];
            if (!win) {
              break;
            }
            const screen = state.screens[0];

            const trayConfig: Partial<IGeometry> = {};
            if (typeof payload.x === "number") {
              trayConfig.x = screen.x + payload.x;
            }
            if (typeof payload.y === "number") {
              trayConfig.y = screen.y + payload.y;
            }
            if (typeof payload.width === "number") {
              trayConfig.width = payload.width;
            }
            if (typeof payload.height === "number") {
              trayConfig.height = payload.height;
            }

            log(`Configuring tray window ${wid}`, trayConfig);
            X.ConfigureWindow(wid, trayConfig);
          }
          break;
      }
    },
  };
}
