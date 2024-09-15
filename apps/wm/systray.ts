import {
  ConfigureTrayPayload,
  addTrayWindowAction,
  configureTrayWindowAction,
  removeTrayWindowAction,
  setTrayBackgroundColorAction,
} from "@bond-wm/shared";
import { IGeometry } from "@bond-wm/shared";
import { numsToBuffer } from "./xutils";
import { IX11Mod, X11_EVENT_TYPE, XCB_COPY_FROM_PARENT, XPropMode } from "@bond-wm/shared";
import { log, logError } from "./log";
import { IXWMEventConsumer, XWMContext } from "./wm";
import { changeWindowEventMask, internAtomAsync } from "./xutils";
const x11: IX11Mod = require("x11");

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

interface NotificationState {
  [trayWid: number]: {
    [messageId: number]: {
      text: string;
      totalSize: number;
      receivedSize: number;
    };
  };
}

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
    _NET_SYSTEM_TRAY_MESSAGE_DATA: await internAtomAsync(X, "_NET_SYSTEM_TRAY_MESSAGE_DATA"),
  };

  let _registered = false;
  //let _rootWid: number;
  let _trayOwnerWid = 0;
  //let _trayDesktopWid = 0;
  let _currentColorPixel: number;
  const frameBrowserWinIdToFrameId: Map<number, number> = new Map();

  const _notificationState: NotificationState = {};

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
    //X.ReparentWindow(trayWid, _trayOwnerWid, 0, 0);
    //X.ReparentWindow(trayWid, _trayDesktopWid, 0, 0);

    //const frameWid = X.AllocID();
    //frameBrowserWinIdToFrameId.set(trayWid, frameWid);
    // X.CreateWindow(frameWid, _rootWid, -16, -16, 16, 16, 0, XCB_COPY_FROM_PARENT, 1, XDisplay.screen[0].root_visual, {
    //   colormap: XDisplay.screen[0].default_colormap,
    //   backgroundPixel: _currentColorPixel,
    //   borderPixel: 0,
    // });

    X.ChangeWindowAttributes(trayWid, {
      backgroundPixel: _currentColorPixel,
    });

    //X.ReparentWindow(trayWid, frameWid, 0, 0);
    X.ConfigureWindow(trayWid, { width: 16, height: 16 });
    //X.MapWindow(frameWid);
  }

  return {
    onScreenCreated(args) {
      if (_registered) {
        return;
      }
      _registered = true;
      //_rootWid = args.root;

      if (typeof _currentColorPixel !== "number") {
        _currentColorPixel = XDisplay.screen[0].black_pixel;
      }

      _trayOwnerWid = X.AllocID();
      X.CreateWindow(
        _trayOwnerWid,
        args.root,
        -1,
        -1,
        1,
        1,
        0,
        XCB_COPY_FROM_PARENT,
        1,
        XDisplay.screen[0].root_visual,
        {
          colormap: XDisplay.screen[0].default_colormap,
          backgroundPixel: _currentColorPixel,
          borderPixel: 0,
        }
      );

      changeWindowEventMask(X, _trayOwnerWid, TRAY_OWNER_EVENT_MASK);

      X.ChangeProperty(
        XPropMode.Replace,
        _trayOwnerWid,
        atoms._NET_SYSTEM_TRAY_ORIENTATION,
        X.atoms.INTEGER,
        32,
        numsToBuffer([SystemTrayOrientation._NET_SYSTEM_TRAY_ORIENTATION_HORZ])
      );

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

      // X.ClearArea(_trayOwnerWid, 0, 0, 1, 1, 1);

      // X.MapWindow(_trayOwnerWid);
    },

    onUnmapNotify(args) {
      if (isTrayWin(args.wid)) {
        store.dispatch(removeTrayWindowAction(args.wid));

        const frameId = frameBrowserWinIdToFrameId.get(args.wid);
        if (typeof frameId === "number") {
          X.DestroyWindow(frameId);
        }
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

          case SystemTrayOps.SYSTEM_TRAY_BEGIN_MESSAGE:
            {
              const trayWid = args.wid;
              const timeout = args.data[2]; // milliseconds, or zero for infinite.
              const messageLength = args.data[3];
              const messageId = args.data[4];
              log(
                `SYSTEM_TRAY_BEGIN_MESSAGE, trayWid=${trayWid}, id=${messageId}, len=${messageLength}, timeout=${timeout}`
              );

              _notificationState[trayWid][messageId] = {
                text: "",
                totalSize: messageLength,
                receivedSize: 0,
              };
            }
            break;

          case SystemTrayOps.SYSTEM_TRAY_CANCEL_MESSAGE:
            {
              const trayWid = args.wid;
              const messageId = args.data[2];
              log(`SYSTEM_TRAY_CANCEL_MESSAGE, trayWid=${trayWid}, id=${messageId}`);

              delete _notificationState[trayWid][messageId];

              // TODO: If already shown, hide it.
            }
            break;

          default:
            log("Unhandled system tray op", args.data[1], SystemTrayOps[args.data[1]]);
            break;
        }
      } else if (args.messageType === atoms._NET_SYSTEM_TRAY_MESSAGE_DATA) {
        const trayWid = args.wid;
        let stateEntry;
        for (const messageId in _notificationState[trayWid]) {
          if (stateEntry) {
            logError(`_NET_SYSTEM_TRAY_MESSAGE_DATA: Unexpected: multiple notification entries`);
          }
          stateEntry = _notificationState[trayWid][messageId];
        }
        if (!stateEntry) {
          logError(`_NET_SYSTEM_TRAY_MESSAGE_DATA: Unexpected: message data for non-existent notification`);
          return;
        }
        const sizeToRead = Math.min(20, stateEntry.totalSize - stateEntry.receivedSize);
        const textBuffer = numsToBuffer(args.data);
        const partialText = textBuffer.toString("utf8", 0, sizeToRead);
        log(`_NET_SYSTEM_TRAY_MESSAGE_DATA, trayWid=${trayWid}, partial=${partialText}`);

        stateEntry.text += partialText;
        stateEntry.receivedSize += sizeToRead;

        if (stateEntry.receivedSize === stateEntry.totalSize) {
          log(`_NET_SYSTEM_TRAY_MESSAGE_DATA, trayWid=${trayWid}, message complete=${stateEntry.text}`);
        }
      }
    },

    onReduxAction(args) {
      if (configureTrayWindowAction.match(args.action)) {
        const state = args.getState();
        const payload = args.action.payload as ConfigureTrayPayload;
        const wid = payload.wid;
        const win = state.tray.windows[wid];
        if (!win) {
          return;
        }

        const screen = state.screens[payload.screenIndex];

        const trayConfig: IGeometry = {
          x: screen.x + payload.x,
          y: screen.y + payload.y,
          width: payload.width,
          height: payload.height,
        };

        log(`Configuring tray window ${wid}`, trayConfig);

        const frameWid = frameBrowserWinIdToFrameId.get(wid);
        if (typeof frameWid === "number") {
          X.ConfigureWindow(frameWid, trayConfig);
          X.ConfigureWindow(wid, {
            x: 0,
            y: 0,
            width: payload.width,
            height: payload.height,
          });
        } else {
          X.ConfigureWindow(wid, trayConfig);
        }

        X.MapWindow(wid);

        // Sometimes tray windows that existed prior to the window manager
        // starting up will be behind the desktop. Raise them just in case.
        if (typeof frameWid === "number") {
          X.RaiseWindow(frameWid);
        }
        X.RaiseWindow(wid);
      } else if (setTrayBackgroundColorAction.match(args.action)) {
        const [r, g, b] = args.action.payload;
        const state = args.getState();
        X.AllocColor(XDisplay.screen[0].default_colormap, r * 256, g * 256, b * 256, function (err, color) {
          log("Changing tray window bg color", color);

          _currentColorPixel = color.pixel;

          if (_trayOwnerWid !== 0) {
            X.ChangeWindowAttributes(_trayOwnerWid, {
              backgroundPixel: _currentColorPixel,
            });
            X.ClearArea(_trayOwnerWid, 0, 0, 1, 1, 1);
          }

          for (const trayWidStr in state.tray.windows) {
            const trayWid = parseInt(trayWidStr, 10);
            const trayInfo = state.tray.windows[trayWidStr];
            X.ChangeWindowAttributes(trayWid, {
              backgroundPixel: _currentColorPixel,
            });
            X.ClearArea(trayWid, 0, 0, trayInfo.location.width, trayInfo.location.height, 1);
          }

          frameBrowserWinIdToFrameId.forEach((frameWid, trayWid) => {
            const trayInfo = state.tray.windows[trayWid];
            X.ChangeWindowAttributes(frameWid, {
              backgroundPixel: _currentColorPixel,
            });
            X.ClearArea(frameWid, 0, 0, trayInfo.location.width, trayInfo.location.height, 1);
          });
        });
      }
    },
  };
}
