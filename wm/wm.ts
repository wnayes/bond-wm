// This file is pretty messy, it is just a prototype for now!

const x11: IX11Mod = require("x11"); // eslint-disable-line

import { app, ipcMain, BrowserWindow } from "electron";
import { IBounds } from "../shared/types";
import * as path from "path";
import * as os from "os";
import { spawn } from "child_process";
import { AsyncReturnType, Mutable } from "type-fest";
import { log, logDir, logError } from "./log";
import { configureWMStore, ServerRootState, ServerStore } from "./configureStore";
import {
  X11_EVENT_TYPE,
  X11_KEY_MODIFIER,
  IXEvent,
  IXConfigureEvent,
  IXScreen,
  IXDisplay,
  IXClient,
  IXKeyEvent,
  XCbWithErr,
  XGeometry,
  XWindowAttrs,
  IXPropertyNotifyEvent,
  XMapState,
  XCB_EVENT_MASK_NO_EVENT,
  IX11Mod,
  XEventMask,
  IX11Client,
  XFocusRevertTo,
  PointerRoot,
  IXConfigureInfo,
  CWMaskBits,
  IClientMessageEvent,
  Atom,
  IXMotionNotifyEvent,
  IXButtonReleaseEvent,
} from "../shared/X";
import { Middleware } from "redux";
import { batch } from "react-redux";
import { anyIntersect } from "../shared/utils";
import { requireExt as requireXinerama } from "./xinerama";
import { createEWMHEventConsumer } from "./ewmh";
import { getPropertyValue, internAtomAsync } from "./xutils";
import { getScreenIndexWithCursor, queryPointer } from "./pointer";
import { createICCCMEventConsumer, getNormalHints, getWMClass, WMSizeHints } from "./icccm";
import { createMotifModule, hasMotifDecorations } from "./motif";
import { ContextMenuKind } from "../shared/ContextMenuKind";
import { showContextMenu } from "./menus";
import {
  addWindowAction,
  configureWindowAction,
  focusWindowAction,
  removeWindowAction,
  setFrameExtentsAction,
  setWindowIntoScreenAction,
  setWindowTitleAction,
  setWindowVisibleAction,
} from "../shared/redux/windowSlice";
import { addScreenAction, setScreenCurrentTagsAction } from "../shared/redux/screenSlice";
import { IWindow } from "../shared/window";
import { setupAutocompleteListener } from "./autocomplete";
import { switchToNextLayout } from "../shared/layouts";
import { customizeWindow } from "./customize";
import { createDragModule } from "./drag";
import { getArgs } from "./args";

interface Geometry {
  width: number;
  height: number;
  x: number;
  y: number;
}

// The values here are arbitrary; we call InternAtom to get the true constants.
export const ExtraAtoms = {
  UTF8_STRING: -1,

  WM_PROTOCOLS: 10000,
  WM_DELETE_WINDOW: 10001,

  _NET_WM_NAME: 340,
};

const NO_EVENT_MASK = 0;

const ROOT_WIN_EVENT_MASK =
  x11.eventMask.SubstructureRedirect |
  x11.eventMask.SubstructureNotify |
  x11.eventMask.EnterWindow |
  x11.eventMask.LeaveWindow |
  x11.eventMask.StructureNotify |
  x11.eventMask.ButtonPress |
  x11.eventMask.ButtonRelease |
  x11.eventMask.FocusChange |
  x11.eventMask.PropertyChange;

const FRAME_WIN_EVENT_MASK =
  x11.eventMask.StructureNotify |
  x11.eventMask.EnterWindow |
  x11.eventMask.LeaveWindow |
  x11.eventMask.SubstructureRedirect |
  x11.eventMask.PointerMotion |
  x11.eventMask.ButtonRelease |
  x11.eventMask.KeyPress;

const CLIENT_WIN_EVENT_MASK =
  x11.eventMask.StructureNotify |
  x11.eventMask.PropertyChange |
  x11.eventMask.FocusChange |
  x11.eventMask.PointerMotion;

export enum XWMWindowType {
  Other = 0,
  Client = 1,
  Frame = 2,
  Desktop = 3,
}

export interface XWMEventConsumerArgs {
  wid: number;
}

export interface XWMEventConsumerArgsWithType extends XWMEventConsumerArgs {
  windowType: XWMWindowType;
}

export interface XWMEventConsumerSetFrameExtentsArgs extends XWMEventConsumerArgs {
  frameExtents: IBounds;
}

export interface XWMEventConsumerClientMessageArgs extends XWMEventConsumerArgsWithType {
  messageType: Atom;
  data: number[];
}

export interface XWMEventConsumerScreenCreatedArgs {
  /** Root window id. */
  root: number;
}

export interface XWMEventConsumerPointerMotionArgs extends XWMEventConsumerArgsWithType {
  rootx: number;
  rooty: number;
}

export interface IXWMEventConsumer {
  onScreenCreated?(args: XWMEventConsumerScreenCreatedArgs): void;

  onClientMessage?(args: XWMEventConsumerClientMessageArgs): void;
  onMapNotify?(args: XWMEventConsumerArgsWithType): void;
  onUnmapNotify?(args: XWMEventConsumerArgsWithType): void;
  onPointerMotion?(args: XWMEventConsumerPointerMotionArgs): void;
  onButtonRelease?(args: XWMEventConsumerArgsWithType): void;
  onKeyPress?(args: XWMEventConsumerArgsWithType): void;

  onSetFrameExtents?(args: XWMEventConsumerSetFrameExtentsArgs): void;
}

export interface XWMContext {
  X: IXClient;
  XDisplay: IXDisplay;
  store: ServerStore;

  getWindowIdFromFrameId(wid: number): number | undefined;
  getFrameIdFromWindowId(wid: number): number | undefined;
}

export function startX(): XServer {
  return createServer();
}

export class XServer {
  // Could put a teardown method here.
}

export function createServer(): XServer {
  const server = new XServer();
  let client: IX11Client;

  let XDisplay: IXDisplay;
  let X: IXClient;

  const eventConsumers: IXWMEventConsumer[] = [];

  let dragModule: AsyncReturnType<typeof createDragModule>;
  let motif: AsyncReturnType<typeof createMotifModule>;

  const knownWids = new Set<number>();
  const winIdToRootId: { [wid: number]: number } = {};

  const desktopBrowsers: BrowserWindow[] = [];
  /** Desktop window handle to index into `desktopBrowsers`. */
  const desktopBrowserHandles: { [did: number]: number } = {};
  const screenIndexToDesktopId: { [screenIndex: number]: number } = {};

  const frameBrowserWindows: { [wid: number]: BrowserWindow | undefined } = {};
  const frameBrowserWinIdToFrameId: { [wid: number]: number | undefined } = {};
  const frameBrowserFrameIdToWinId: { [fid: number]: number | undefined } = {};

  const initializingWins: { [win: number]: boolean } = {};

  let ignoreEnterLeave = false;

  /**
   * The last frame extents used for a window.
   * Since the frame takes a little bit to render, and the extents are usually the same,
   * we track this and use these extents as default as an optimization.
   */
  let lastFrameExtents: IBounds | undefined;

  const store = __setupStore();

  const context: XWMContext = {
    X,
    XDisplay,
    store,
    getWindowIdFromFrameId,
    getFrameIdFromWindowId,
  };

  // If `true`, send to the desktop browser.
  // If a function, execute when pressed.
  // `xmodmap -pk` for codes.
  const registeredKeys: {
    [keyModifiers: number]: { [keyCode: number]: boolean | VoidFunction };
  } = {
    [X11_KEY_MODIFIER.Mod4Mask]: {
      // Mod4 + O
      32: () => sendActiveWindowToNextScreen(),

      // Mod4 + R
      27: true,

      // Mod4 + Enter, TODO: launch default/configurable terminal.
      36: () => launchProcess("urxvt"),

      // Mod4 + Space
      65: () => switchToNextLayoutWM(),
    },
    [X11_KEY_MODIFIER.Mod4Mask | X11_KEY_MODIFIER.ShiftMask]: {
      // Mod4 + Shift + C
      54: () => closeFocusedWindow(),
      // Mod4 + Shift + M
      58: () => startDragFocusedWindow(),
      // Mod4 + Shift + Q
      24: () => app.quit(),
    },
    [X11_KEY_MODIFIER.Mod4Mask | X11_KEY_MODIFIER.ControlMask]: {
      // Mod4 + Ctrl + R
      27: () => {
        app.relaunch();
        app.exit(0);
      },
    },
  };

  // Initialization.
  (() => {
    client = x11.createClient(async (err: unknown, display: IXDisplay) => {
      if (err) {
        logError(err);
        process.exit(1);
      }

      XDisplay = context.XDisplay = display;
      X = context.X = display.client;

      dragModule = await createDragModule(context);
      eventConsumers.push(dragModule);
      eventConsumers.push(await createICCCMEventConsumer(context));
      eventConsumers.push(await createEWMHEventConsumer(context, dragModule));

      motif = await createMotifModule(context);

      await __setupAtoms();
      await __initDesktop();
    });

    client.on("error", logError);
    client.on("event", __onXEvent);

    ipcMain.on("raise-window", (event, wid) => {
      raiseWindow(wid);
    });

    ipcMain.on("minimize-window", (event, wid) => {
      minimize(wid);
    });

    ipcMain.on("close-window", (event, wid) => {
      closeWindow(wid);
    });

    ipcMain.on("focus-desktop-browser", (event, screenIndex) => {
      setFocusToDesktopWindow(screenIndex);
    });

    ipcMain.on("exec", (event, args) => {
      launchProcess(args.executable);
    });

    ipcMain.on("show-context-menu", (event, args: { menuKind: ContextMenuKind }) => {
      showContextMenu(event, args.menuKind);
    });

    ipcMain.on("show-desktop-dev-tools", (event, args: { screenIndex: number }) => {
      desktopBrowsers[args.screenIndex]?.webContents?.openDevTools();
    });

    setupAutocompleteListener();
  })();

  async function __setupAtoms(): Promise<void> {
    // TODO: Typings are a little awkward here.
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const extraAtoms = ExtraAtoms as Mutable<typeof ExtraAtoms>;
    extraAtoms.UTF8_STRING = (await internAtomAsync(X, "UTF8_STRING")) as any;

    extraAtoms.WM_PROTOCOLS = (await internAtomAsync(X, "WM_PROTOCOLS")) as any;
    extraAtoms.WM_DELETE_WINDOW = (await internAtomAsync(X, "WM_DELETE_WINDOW")) as any;

    extraAtoms._NET_WM_NAME = (await internAtomAsync(X, "_NET_WM_NAME")) as any;

    log("ExtraAtoms", extraAtoms);
    /* eslint-enable @typescript-eslint/no-explicit-any */
  }

  async function __initDesktop(): Promise<void> {
    for (const screen of XDisplay.screen) {
      await __initScreen(screen);
    }
  }

  async function __initScreen(screen: IXScreen): Promise<void> {
    const root = screen.root;

    const debugScreen = Object.assign({}, screen);
    delete debugScreen.depths;
    log("Processing X screen", debugScreen);

    X.GrabServer();

    changeWindowEventMask(root, ROOT_WIN_EVENT_MASK);

    X.UngrabServer();

    const logicalScreens = await getScreenGeometries(screen);
    log("Obtained logical screens", logicalScreens);

    for (const logicalScreen of logicalScreens) {
      store.dispatch(
        addScreenAction({
          x: logicalScreen.x,
          y: logicalScreen.y,
          width: logicalScreen.width,
          height: logicalScreen.height,
          root,
        })
      );

      const did = createDesktopBrowser({
        width: logicalScreen.width,
        height: logicalScreen.height,
      });

      X.ConfigureWindow(did, {
        borderWidth: 0,
        width: logicalScreen.width,
        height: logicalScreen.height,
      });

      X.ReparentWindow(did, root, logicalScreen.x, logicalScreen.y);
    }

    X.QueryTree(root, (err, tree) => {
      tree.children.forEach((childWid) => manageWindow(childWid, { screenIndex: 0, checkUnmappedState: true }));
    });

    __setupKeyShortcuts(root);

    X.SetInputFocus(PointerRoot, XFocusRevertTo.PointerRoot);

    eventConsumers.forEach((consumer) => consumer.onScreenCreated?.({ root }));
  }

  function __setupKeyShortcuts(rootWid: number) {
    for (const modifier in registeredKeys) {
      if (!registeredKeys.hasOwnProperty(modifier)) continue;

      for (const key in registeredKeys[modifier]) {
        if (!registeredKeys[modifier].hasOwnProperty(key)) continue;

        X.GrabKey(rootWid, true, parseInt(modifier, 10), parseInt(key, 10), 1 /* Async */, 1 /* Async */);
      }
    }
  }

  function isDesktopBrowserWin(win: number): boolean {
    return desktopBrowserHandles.hasOwnProperty(win);
  }

  function isFrameBrowserWin(win: number) {
    return frameBrowserFrameIdToWinId.hasOwnProperty(win);
  }

  function getFrameIdFromWindowId(wid: number): number | undefined {
    return frameBrowserWinIdToFrameId[wid];
  }

  function getWindowIdFromFrameId(wid: number): number | undefined {
    return frameBrowserFrameIdToWinId[wid];
  }

  function getRootIdFromWindowId(wid: number): number | undefined {
    return winIdToRootId[wid];
  }

  function createDesktopBrowser(props: { width: number; height: number }) {
    const win = new BrowserWindow({
      frame: false,
      fullscreen: true,
      width: props.width,
      height: props.height,
      type: "desktop",
      webPreferences: {
        preload: path.resolve(path.join(__dirname, "../renderer-shared/preload.js")),
        nodeIntegration: true,
        contextIsolation: false,
      },
    });

    const index = desktopBrowsers.length;
    desktopBrowsers[index] = win;

    const url = path.join(__dirname, "../renderer-desktop/index.html") + "?screen=" + index;
    win.loadURL("file://" + url);

    const handle = getNativeWindowHandleInt(win);
    if (!handle) {
      logError("Browser handle was null");
    }
    desktopBrowserHandles[handle] = index;
    screenIndexToDesktopId[index] = handle;

    log("Created browser window", handle);

    win.on("closed", function () {
      desktopBrowsers[index] = null;
    });

    return handle;
  }

  function createFrameBrowser(wid: number, geometry: Geometry) {
    const win = new BrowserWindow({
      frame: false,
      width: geometry.width,
      height: geometry.height,
      x: geometry.x,
      y: geometry.y,
      backgroundColor: "#00000000",
      transparent: true,
      webPreferences: {
        preload: path.resolve(path.join(__dirname, "../renderer-shared/preload.js")),
        nodeIntegration: true,
        contextIsolation: false,
      },
    });

    const url = path.join(__dirname, "../renderer-frame/index.html") + "?wid=" + wid;
    win.loadURL("file://" + url);

    frameBrowserWindows[wid] = win;

    const fid = getNativeWindowHandleInt(win);
    if (!fid) {
      logError("Frame window handle was null");
    }
    frameBrowserWinIdToFrameId[wid] = fid;
    frameBrowserFrameIdToWinId[fid] = wid;

    log("Created frame window", fid, url);

    return fid;
  }

  function __onXEvent(ev: IXEvent) {
    const { type } = ev;

    switch (type) {
      case X11_EVENT_TYPE.KeyPress:
        onKeyPress(ev as IXKeyEvent);
        break;
      case X11_EVENT_TYPE.KeyRelease:
        break;
      case X11_EVENT_TYPE.ButtonPress:
        onButtonPress(ev as IXButtonReleaseEvent);
        break;
      case X11_EVENT_TYPE.ButtonRelease:
        onButtonRelease(ev as IXButtonReleaseEvent);
        break;
      case X11_EVENT_TYPE.MotionNotify:
        onPointerMotion(ev as IXMotionNotifyEvent);
        break;
      case X11_EVENT_TYPE.EnterNotify:
        onEnterNotify(ev);
        break;
      case X11_EVENT_TYPE.LeaveNotify:
        onLeaveNotify(ev);
        break;
      case X11_EVENT_TYPE.FocusIn:
        widLog(ev.wid, "onFocusIn", ev);
        break;
      case X11_EVENT_TYPE.FocusOut:
        widLog(ev.wid, "onFocusOut", ev);
        break;
      case X11_EVENT_TYPE.Expose:
        widLog(ev.wid, "onExpose", ev);
        break;
      case X11_EVENT_TYPE.CreateNotify:
        onCreateNotify(ev);
        break;
      case X11_EVENT_TYPE.DestroyNotify:
        onDestroyNotify(ev);
        break;
      case X11_EVENT_TYPE.UnmapNotify:
        onUnmapNotify(ev);
        break;
      case X11_EVENT_TYPE.MapNotify:
        onMapNotify(ev);
        break;
      case X11_EVENT_TYPE.MapRequest:
        onMapRequest(ev);
        break;
      case X11_EVENT_TYPE.ReparentNotify:
        widLog(ev.wid, "onReparentNotify", ev);
        break;
      case X11_EVENT_TYPE.ConfigureNotify:
        break;
      case X11_EVENT_TYPE.ConfigureRequest:
        onConfigureRequest(ev as IXConfigureEvent);
        break;
      case X11_EVENT_TYPE.ClientMessage:
        onClientMessage(ev as IClientMessageEvent);
        break;
      case X11_EVENT_TYPE.PropertyNotify:
        onPropertyNotify(ev as IXPropertyNotifyEvent);
        break;
      default:
        log("Unhandled event", ev);
        break;
    }
  }

  interface ManageWindowOpts {
    screenIndex: number;
    checkUnmappedState: boolean;
    focusWindow?: boolean;
  }

  async function manageWindow(wid: number, opts: ManageWindowOpts): Promise<void> {
    const { checkUnmappedState, focusWindow } = opts;
    let { screenIndex } = opts;

    widLog(wid, `Manage window on screen ${screenIndex}`);

    if (initializingWins[wid]) {
      log(`Skip manage, ${wid} is already initializing`);
      return;
    }
    if (knownWids.has(wid)) {
      log(`Skip manage, ${wid} is known`);
      return;
    }
    if (isFrameBrowserWin(wid)) {
      log(`Skip manage, ${wid} is a frame window`);
      return;
    }

    // Make sure we don't respond to too many messages at once.
    initializingWins[wid] = true;
    knownWids.add(wid);

    const values = await Promise.all([
      determineWindowAttributes(wid),
      determineWindowGeometry(wid),
      getWindowTitle(wid),
      getWMClass(X, wid),
      getNormalHints(X, wid),
      motif.getMotifHints(wid),
    ]);

    const [attrs, clientGeom, title, wmClass, normalHints, motifHints] = values;
    log(`got values for ${wid}:`, values);

    const isOverrideRedirect = attrs.overrideRedirect === 1;
    if (isOverrideRedirect) {
      log(`Not managing ${wid} due to override redirect.`);
    }

    const isUnmappedState = checkUnmappedState && attrs.mapState === XMapState.IsUnmapped;
    if (isUnmappedState) {
      log(`Not managing ${wid} due to unmapped state.`);
    }

    if (isOverrideRedirect || isUnmappedState) {
      delete initializingWins[wid];
      X.MapWindow(wid);
      return;
    }

    ignoreEnterLeave = true;

    X.ChangeSaveSet(1, wid);

    if (shouldCreateFrame(wid, clientGeom)) {
      const effectiveGeometry = getGeometryForWindow(clientGeom, normalHints);

      const win: Partial<IWindow> = {
        outer: {
          x: effectiveGeometry.x,
          y: effectiveGeometry.y,
          width: effectiveGeometry.width,
          height: effectiveGeometry.height,
        },
        frameExtents: lastFrameExtents,
        visible: true,
        decorated: hasMotifDecorations(motifHints),
        title,
        wmClass,
        screenIndex,
        normalHints,
      };

      const state = store.getState();

      customizeWindow(win);

      // Accept any update to screenIndex (if it is valid).
      let screen = state.screens[win.screenIndex];
      if (screen) {
        screenIndex = win.screenIndex;
      } else {
        win.screenIndex = screenIndex;
        screen = state.screens[win.screenIndex];
      }

      if (!win.tags) {
        win.tags = [screen.currentTags[0]];
      }

      const [frameX, frameY] = [screen.x + win.outer.x, screen.y + win.outer.y];

      const fid = createFrameBrowser(wid, { ...win.outer, x: frameX, y: frameY });
      knownWids.add(fid);

      winIdToRootId[wid] = screen.root;
      winIdToRootId[fid] = screen.root;

      X.ReparentWindow(fid, screen.root, frameX, frameY);
      X.ReparentWindow(wid, fid, lastFrameExtents?.left || 0, lastFrameExtents?.top || 0);

      X.GrabServer();

      changeWindowEventMask(fid, FRAME_WIN_EVENT_MASK);
      changeWindowEventMask(wid, CLIENT_WIN_EVENT_MASK);

      X.UngrabServer();

      X.ConfigureWindow(fid, { borderWidth: 0, x: frameX, y: frameY });
      X.ConfigureWindow(wid, { borderWidth: 0 });

      store.dispatch(addWindowAction({ wid, ...win }));

      X.MapWindow(fid);
    }

    log("Initial map of wid", wid);
    X.MapWindow(wid);

    if (focusWindow) {
      setFocus(wid);
    }

    delete initializingWins[wid];
  }

  function unmanageWindow(wid: number): void {
    if (isFrameBrowserWin(wid)) {
      widLog(wid, `Unmanage frame window`);

      const innerWid = frameBrowserFrameIdToWinId[wid];
      delete frameBrowserFrameIdToWinId[wid];
      delete frameBrowserWinIdToFrameId[innerWid];
      delete frameBrowserWindows[innerWid];
    } else if (isClientWin(wid)) {
      widLog(wid, `Unmanage window`);

      const focusedWid = getFocusedWindowId();
      const win = getWinFromStore(wid);

      store.dispatch(removeWindowAction(wid));

      const fid = getFrameIdFromWindowId(wid);
      if (typeof fid === "number" && fid !== wid) {
        // Reparent the hosted window back to the root before destroying the BrowserWindow.
        // This prevents a browser save popup closing from taking out the entire browser process for example.
        // (Presumably destroying the BrowserWindow with a window inside it triggers mass destruction.)
        const screen = store.getState().screens[win.screenIndex];
        X.ReparentWindow(wid, screen.root, 0, 0);

        log("Destroying BrowserWindow for frame " + fid);
        frameBrowserWindows[wid].destroy();
      }

      if (wid === focusedWid && win) {
        setFocusToDesktopWindow(win.screenIndex);
      }
    }

    knownWids.delete(wid);
    delete winIdToRootId[wid];
  }

  function shouldCreateFrame(wid: number, geometry: XGeometry): boolean {
    if (isDesktopBrowserWin(wid)) {
      return false;
    }

    // Positioned negatively outside the desktop.
    if (geometry.xPos + geometry.width < 0 || geometry.yPos + geometry.height < 0) {
      return false;
    }

    // TODO: Positioned positively outside?

    return true;
  }

  function getGeometryForWindow(clientGeom: XGeometry, normalHints: WMSizeHints | undefined): Geometry {
    const effectiveGeometry = {
      height: clientGeom.height,
      width: clientGeom.width,
      x: clientGeom.xPos,
      y: clientGeom.yPos,
    };
    if (normalHints.maxHeight > 0) {
      effectiveGeometry.height = Math.min(effectiveGeometry.height, normalHints.maxHeight);
    }
    if (normalHints.minHeight > 0) {
      effectiveGeometry.height = Math.max(effectiveGeometry.height, normalHints.minHeight);
    }
    if (normalHints.maxWidth > 0) {
      effectiveGeometry.width = Math.min(effectiveGeometry.width, normalHints.maxWidth);
    }
    if (normalHints.minWidth > 0) {
      effectiveGeometry.width = Math.max(effectiveGeometry.width, normalHints.minWidth);
    }

    return effectiveGeometry;
  }

  function changeWindowEventMask(wid: number, eventMask: XEventMask): boolean {
    let failed;
    log("Changing event mask for", wid, eventMask);
    X.ChangeWindowAttributes(wid, { eventMask }, (err: { error: number }) => {
      if (err && err.error === 10) {
        logError(
          `Error while changing event mask for for ${wid} to ${eventMask}: Another window manager already running.`,
          err
        );
        failed = true;
        return;
      }
      logError(`Error while changing event mask for for ${wid} to ${eventMask}`, err);
      failed = true;
    });
    return !failed;
  }

  function runXCallsWithoutEvents(wid: number, fn: VoidFunction): void {
    X.GrabServer();
    try {
      const root = getRootIdFromWindowId(wid);
      if (typeof root === "number") {
        changeWindowEventMask(root, NO_EVENT_MASK);
      }
      const fid = getFrameIdFromWindowId(wid);
      if (typeof fid === "number") {
        changeWindowEventMask(fid, NO_EVENT_MASK);
      }
      changeWindowEventMask(wid, NO_EVENT_MASK);

      try {
        fn();
      } finally {
        if (typeof root === "number") {
          changeWindowEventMask(root, ROOT_WIN_EVENT_MASK);
        }
        if (typeof fid === "number") {
          changeWindowEventMask(fid, FRAME_WIN_EVENT_MASK);
        }
        changeWindowEventMask(wid, CLIENT_WIN_EVENT_MASK);
      }
    } finally {
      X.UngrabServer();
    }
  }

  function onCreateNotify(ev: IXEvent) {
    const { wid } = ev;
    widLog(wid, "onCreateNotify", ev);
  }

  async function onMapRequest(ev: IXEvent) {
    const { wid } = ev;
    widLog(wid, "onMapRequest", ev);

    if (initializingWins[wid]) return;

    if (knownWids.has(wid)) {
      showWindow(wid);
    } else {
      const screenIndex = Math.max(0, await getScreenIndexWithCursor(context, wid));
      manageWindow(wid, { screenIndex, focusWindow: true, checkUnmappedState: false });
    }
  }

  function onMapNotify(ev: IXEvent) {
    const { wid } = ev;
    widLog(wid, "onMapNotify", ev);

    if (isClientWin(wid)) {
      eventConsumers.forEach((consumer) => consumer.onMapNotify?.({ wid, windowType: getWindowType(wid) }));
    }
  }

  function onUnmapNotify(ev: IXEvent) {
    const { wid } = ev;
    widLog(wid, "onUnmapNotify", ev);

    eventConsumers.forEach((consumer) => consumer.onUnmapNotify?.({ wid, windowType: getWindowType(wid) }));

    unmanageWindow(wid);
  }

  function onDestroyNotify(ev: IXEvent) {
    const { wid } = ev;
    widLog(wid, "onDestroyNotify", ev);

    unmanageWindow(wid);
  }

  function onConfigureRequest(ev: IXConfigureEvent) {
    const { wid } = ev;

    // Until node-x11 5a1fb64 reaches npm, `mask` needs to be read from the raw data.
    const mask = (ev.mask = ev.rawData.readUInt16LE(26));

    widLog(wid, "onConfigureRequest", ev);

    // Ignore any configure requests for these; we always control their size.
    if (isDesktopBrowserWin(wid) || isFrameBrowserWin(wid)) {
      return;
    }

    if (isClientWin(wid)) {
      if (!mask) {
        return; // There's no requested changes?
      }

      const win = getWinFromStore(wid);
      const screen = store.getState().screens[win.screenIndex];

      const config: Partial<IXConfigureInfo> = {};
      if (mask & CWMaskBits.CWX) {
        // ev.x is absolute, but our state is relative to the screen.
        config.x = ev.x - screen.x;
      }
      if (mask & CWMaskBits.CWY) {
        config.y = ev.y - screen.y;
      }
      if (mask & CWMaskBits.CWWidth) {
        config.width = ev.width;
      }
      if (mask & CWMaskBits.CWHeight) {
        config.height = ev.height;
      }

      if (Object.keys(config).length > 0) {
        store.dispatch(configureWindowAction({ wid, ...config }));
      }
    } else {
      // Some unmanaged window; pass the call through.
      X.ConfigureWindow(wid, ev);
    }
  }

  function onEnterNotify(ev: IXEvent) {
    const { wid } = ev;
    widLog(wid, "onEnterNotify", ignoreEnterLeave ? "ignoring" : "handling");

    if (ignoreEnterLeave) {
      return;
    }

    const isFrame = isFrameBrowserWin(wid);
    const window = isFrame ? getWindowIdFromFrameId(wid) : wid;

    setFocus(window);
  }

  function onLeaveNotify(ev: IXEvent) {
    const { wid } = ev;
    widLog(wid, "onLeaveNotify", ignoreEnterLeave ? "ignoring" : "handling");
  }

  function onPointerMotion(ev: IXMotionNotifyEvent): void {
    const { wid } = ev;
    // widLog(wid, "onPointerMotion", ev);

    if (ignoreEnterLeave) {
      widLog(wid, "onMotionNotify", "clearing enterleave ignore");
      ignoreEnterLeave = false;
    }

    eventConsumers.forEach((consumer) =>
      consumer.onPointerMotion?.({
        wid,
        windowType: getWindowType(wid),
        rootx: ev.rootx,
        rooty: ev.rooty,
      })
    );
  }

  async function onKeyPress(ev: IXKeyEvent) {
    const { wid } = ev;
    widLog(wid, "onKeyPress", ev);

    eventConsumers.forEach((consumer) =>
      consumer.onKeyPress?.({
        wid,
        windowType: getWindowType(wid),
      })
    );

    const kb = registeredKeys;
    if (kb[ev.buttons]) {
      const entry = kb[ev.buttons][ev.keycode];
      if (typeof entry === "function") {
        entry();
      } else if (typeof entry === "boolean") {
        const screenIndex = await getScreenIndexWithCursor(context, wid);
        const browser = desktopBrowsers[screenIndex];
        if (browser) {
          browser.webContents.send("x-keypress", {
            buttons: ev.buttons,
            keycode: ev.keycode,
          });
        }
      }
    }
  }

  function onButtonPress(ev: IXButtonReleaseEvent) {
    const { wid } = ev;

    // Why is this coming through ButtonPress?
    if (ev.name === "ButtonRelease") {
      onButtonRelease(ev);
      return;
    }

    widLog(wid, "onButtonPress", ev);
  }

  function onButtonRelease(ev: IXButtonReleaseEvent) {
    const { wid } = ev;
    widLog(wid, "onButtonPress", ev);

    eventConsumers.forEach((consumer) =>
      consumer.onButtonRelease?.({
        wid,
        windowType: getWindowType(wid),
      })
    );
  }

  function onClientMessage(ev: IClientMessageEvent) {
    const { wid } = ev;

    widLog(wid, "onClientMessage", ev);
    X.GetAtomName(ev.message_type, (err, name) => log(`(Client message message_type ${ev.message_type} == ${name})`));

    eventConsumers.forEach((consumer) =>
      consumer.onClientMessage?.({
        wid,
        windowType: getWindowType(wid),
        messageType: ev.message_type,
        data: ev.data,
      })
    );
  }

  async function onPropertyNotify(ev: IXPropertyNotifyEvent): Promise<void> {
    const { wid, atom } = ev;
    widLog(wid, "onPropertyNotify", ev);

    if (isFrameBrowserWin(wid) || isDesktopBrowserWin(wid)) {
      return;
    }

    switch (atom) {
      case X.atoms.WM_NAME:
      case ExtraAtoms._NET_WM_NAME:
        {
          const title = await getWindowTitle(wid);
          store.dispatch(setWindowTitleAction({ wid, title }));
        }
        break;

      default:
        X.GetAtomName(atom, (err, name) => log(`Atom ${atom} (${name}) for property change is unhandled.`));
        break;
    }
  }

  function launchProcess(name: string) {
    log("launchProcess", name);

    const child = spawn(name, [], {
      detached: true,
      stdio: "ignore",
    });
    child.unref(); // Allow electron to close before this child
  }

  function determineWindowAttributes(wid: number): Promise<XWindowAttrs> {
    return new Promise((resolve, reject) => {
      X.GetWindowAttributes(wid, function (err: unknown, attrs) {
        if (err) {
          logError("Couldn't GetWindowAttributes", wid, err);
          reject(err);
          return;
        }

        resolve(attrs);
      });
    });
  }

  function determineWindowGeometry(wid: number): Promise<XGeometry> {
    return new Promise((resolve, reject) => {
      X.GetGeometry(wid, function (err: unknown, clientGeom) {
        if (err) {
          logError("Couldn't read geometry", err);
          reject(err);
          return;
        }

        resolve(clientGeom);
      });
    });
  }

  async function getWindowTitle(wid: number): Promise<string | undefined> {
    const [name, utf8name] = await Promise.all([
      getPropertyValue<string>(X, wid, X.atoms.WM_NAME, X.atoms.STRING),
      getPropertyValue<string>(X, wid, ExtraAtoms._NET_WM_NAME, ExtraAtoms.UTF8_STRING),
    ]);

    return utf8name || name;
  }

  // function determineWindowDecorated(wid: number): Promise<boolean> {
  //   return new Promise((resolve, reject) => {
  //     X.InternAtom(true, "_MOTIF_WM_HINTS", (err, atom) => {
  //       if (err) {
  //         logError("InternAtom _MOTIF_WM_HINTS error", err);
  //         reject(err);
  //         return;
  //       }

  //       X.GetProperty(0, wid, atom, 0, 0, 10000000, (err, prop) => {
  //         if (err) {
  //           logError("GetProperty _MOTIF_WM_HINTS error", err);
  //           reject(err);
  //           return;
  //         }

  //         const buffer = prop.data;
  //         if (buffer && buffer.length) {
  //           if (buffer[0] === 0x02) {
  //             // Specifying decorations
  //             if (buffer[2] === 0x00) {
  //               // No decorations
  //               resolve(false);
  //             }
  //           }
  //         }
  //         resolve(true);
  //       });
  //     });
  //   });
  // }

  /**
   * By default, one screen means one screen geometry.
   * But if Xinerama is in play, we may have multiple logical screens
   * represented within a single screen.
   */
  function getScreenGeometries(screen: IXScreen): Promise<Geometry[]> {
    return new Promise((resolve) => {
      const defaultGeometry: Geometry = {
        x: 0,
        y: 0,
        width: screen.pixel_width,
        height: screen.pixel_height,
      };

      requireXinerama(XDisplay, (err, xinerama) => {
        if (!xinerama) {
          resolve([defaultGeometry]);
          return;
        }

        xinerama.IsActive((err, isActive) => {
          if (!isActive) {
            resolve([defaultGeometry]);
            return;
          }

          xinerama.QueryScreens((err, screenInfos) => {
            if (err || !screenInfos) {
              resolve([defaultGeometry]);
              return;
            }

            resolve(screenInfos);
          });
        });
      });
    });
  }

  function getFocusedWindowId(): number | null {
    const windows = store.getState().windows;
    for (const wid in windows) {
      if (windows[wid].focused) return parseInt(wid);
    }
    return null;
  }

  function XGetWMProtocols(wid: number, callback: XCbWithErr<[number[] | void]>) {
    X.GetProperty(0, wid, ExtraAtoms.WM_PROTOCOLS, 0, 0, 10000000, (err, prop) => {
      if (err) {
        callback(err);
        return;
      }

      const protocols = [];
      if (prop && prop.data && prop.data.length) {
        const len = prop.data.length;
        if (len % 4) {
          callback("Bad length on WM protocol buffer");
          return;
        }

        for (let i = 0; i < len; i += 4) {
          protocols.push(prop.data.readUInt32LE(i));
        }
      }

      callback(null, protocols);
    });
  }

  async function startDragFocusedWindow(): Promise<void> {
    const wid = getFocusedWindowId();
    if (typeof wid === "number" && !isDesktopBrowserWin(wid)) {
      const pointerInfo = await queryPointer(X, wid);
      if (pointerInfo) {
        dragModule.startMove(wid, [pointerInfo.rootX, pointerInfo.rootY]);
      }
    }
  }

  function closeFocusedWindow(): void {
    const wid = getFocusedWindowId();
    if (typeof wid === "number" && !isDesktopBrowserWin(wid)) {
      closeWindow(wid);
    }
  }

  function closeWindow(wid: number) {
    const nextFocusWid = wid === getFocusedWindowId() ? getNextFocusWid(wid) : undefined;

    supportsGracefulDestroy(wid, (err, args) => {
      if (err) {
        log("Error in supportsGracefulDestroy", err);
      }
      if (args && args.supported) {
        const eventData = Buffer.alloc(32);
        eventData.writeUInt8(X11_EVENT_TYPE.ClientMessage, 0); // Event Type 33 = ClientMessage
        eventData.writeUInt8(32, 1); // Format
        eventData.writeUInt32LE(wid, 4); // Window ID
        eventData.writeUInt32LE(ExtraAtoms.WM_PROTOCOLS, 8); // Message Type
        eventData.writeUInt32LE(ExtraAtoms.WM_DELETE_WINDOW, 12); // data32[0]
        // Also send a timestamp in data32[1]?
        widLog(wid, "Sending graceful kill", eventData);
        X.SendEvent(wid, false, XCB_EVENT_MASK_NO_EVENT, eventData);
      } else {
        widLog(wid, "Killing window client");
        X.KillClient(wid);
      }

      if (typeof nextFocusWid == "number") {
        setFocus(nextFocusWid);
      }
    });
  }

  function supportsGracefulDestroy(wid: number, callback: XCbWithErr<[{ supported: boolean } | void]>) {
    XGetWMProtocols(wid, (err, protocols) => {
      if (err) {
        logError("XGetWMProtocols error", err);
        callback(err);
        return;
      }

      callback(null, {
        supported: !!protocols && protocols.indexOf(ExtraAtoms.WM_DELETE_WINDOW) >= 0,
      });
    });
  }

  function getNextFocusWid(widLosingFocus: number): number | undefined {
    let nextFocusWid: number | undefined;
    const win = getWinFromStore(widLosingFocus);
    if (win) {
      const wins = store.getState().windows;
      for (const widStr in wins) {
        const otherWin = wins[widStr];
        if (otherWin.id !== widLosingFocus && otherWin.screenIndex === win.screenIndex) {
          nextFocusWid = otherWin.id;

          // Not breaking here, on the chance that we end up finding the "most recent"
          // window later on in the enumeration. (Probably should implement some sort
          // of true "focus history" stack.)
        }
      }

      if (typeof nextFocusWid === "undefined") {
        nextFocusWid = screenIndexToDesktopId[win.screenIndex];
      }
    }
    return nextFocusWid;
  }

  function showWindow(wid: number) {
    let fid;
    const isFrame = isFrameBrowserWin(wid);
    if (isFrame) {
      fid = wid;
      wid = getWindowIdFromFrameId(wid);
    } else {
      fid = getFrameIdFromWindowId(wid);
    }

    if (typeof fid === "number") {
      log("showWindow frame id", fid);
      X.MapWindow(fid);
    }

    const win = getWinFromStore(wid);
    if (win?.visible === false) {
      store.dispatch(setWindowVisibleAction({ wid, visible: true }));
    }

    log("showWindow id", wid);
    X.MapWindow(wid);
  }

  /** Hides a window without destroying its frame. */
  function hideWindow(wid: number) {
    const fid = getFrameIdFromWindowId(wid);

    runXCallsWithoutEvents(wid, () => {
      if (typeof fid === "number") {
        X.UnmapWindow(fid);
      } else if (wid) {
        X.UnmapWindow(wid);
      }
    });

    const win = getWinFromStore(wid);
    if (win?.visible === true) {
      store.dispatch(setWindowVisibleAction({ wid, visible: false }));
    }
  }

  function raiseWindow(wid: number) {
    const win = getWinFromStore(wid);

    if (!win.visible) {
      showWindow(wid);
    } else {
      const fid = getFrameIdFromWindowId(wid);
      if (fid) {
        X.RaiseWindow(fid);
      }
      if (wid) {
        X.RaiseWindow(wid);
      }

      setFocus(wid);
    }
  }

  function minimize(wid: number) {
    widLog(wid, "minimize");
    hideWindow(wid);
  }

  function setFocus(wid: number) {
    if (isClientWin(wid)) {
      setXInputFocus(wid);

      store.dispatch(focusWindowAction({ wid }));
    } else if (isDesktopBrowserWin(wid)) {
      setXInputFocus(wid);
    }
  }

  function setFocusToDesktopWindow(screenIndex: number) {
    const did = screenIndexToDesktopId[screenIndex];
    if (typeof did === "number") {
      setXInputFocus(did);
    }
  }

  function setXInputFocus(wid: number): void {
    widLog(wid, "Setting X input focus");

    X.SetInputFocus(wid, XFocusRevertTo.PointerRoot);
  }

  function sendActiveWindowToNextScreen(): void {
    const screenCount = store.getState().screens.length;
    if (screenCount === 1) {
      return; // Only one screen, can't switch.
    }
    const wid = getFocusedWindowId();
    const win = getWinFromStore(wid);
    if (win) {
      const nextScreen = (win.screenIndex + 1) % screenCount;
      store.dispatch(setWindowIntoScreenAction({ wid, screenIndex: nextScreen }));
    }
  }

  async function switchToNextLayoutWM(): Promise<void> {
    const screens = store.getState().screens;
    let screenIndex = 0;
    if (screens.length > 1) {
      screenIndex = Math.max(0, await getScreenIndexWithCursor(context, screens[0].root));
    }
    switchToNextLayout(store, screenIndex);
  }

  function widLog(wid: number, ...args: unknown[]): void {
    const details = [];
    if (typeof wid === "number") {
      details.push(wid);

      switch (getWindowType(wid)) {
        case XWMWindowType.Frame:
          details.push(`(frame for ${getWindowIdFromFrameId(wid)})`);
          break;
        case XWMWindowType.Desktop:
          details.push("(desktop)");
          break;
      }
    }

    const logArgs = [...details, ...args];
    log(...logArgs);
  }

  function getWindowType(wid: number): XWMWindowType {
    if (isFrameBrowserWin(wid)) {
      return XWMWindowType.Frame;
    }
    if (isDesktopBrowserWin(wid)) {
      return XWMWindowType.Desktop;
    }
    if (isClientWin(wid)) {
      return XWMWindowType.Client;
    }

    return XWMWindowType.Other;
  }

  function isClientWin(wid: number): boolean {
    return !!getWinFromStore(wid);
  }

  function getWinFromStore(wid: number): IWindow | undefined {
    return store.getState().windows[wid];
  }

  function __setupStore(): ServerStore {
    const loggerMiddleware: Middleware = function ({ getState }) {
      return (next) => (action) => {
        log("will dispatch", action);

        // Call the next dispatch method in the middleware chain.
        const returnValue = next(action);

        log("state after dispatch:");
        logDir(getState(), { depth: 3 });

        // This will likely be the action itself, unless
        // a middleware further in chain changed it.
        return returnValue;
      };
    };

    const x11Middleware: Middleware<unknown, ServerRootState> = function ({ getState }) {
      return (next) => (action) => {
        const returnValue = next(action);

        switch (action.type) {
          case configureWindowAction.type:
            {
              const state = getState();
              const payload: Partial<Geometry> = action.payload;
              const wid = action.payload.wid;
              const win = state.windows[wid];
              const screen = state.screens[win.screenIndex];

              const fid = getFrameIdFromWindowId(wid) ?? wid;
              const frameConfig: Partial<Geometry> = {};
              if (typeof payload.x === "number") {
                frameConfig.x = screen.x + payload.x;
              }
              if (typeof payload.y === "number") {
                frameConfig.y = screen.y + payload.y;
              }
              if (typeof payload.width === "number") {
                frameConfig.width = payload.width;
              }
              if (typeof payload.height === "number") {
                frameConfig.height = payload.height;
              }
              widLog(fid, "Configuring from X11 middleware", frameConfig);
              X.ConfigureWindow(fid, frameConfig);

              if (fid !== wid && win) {
                X.ConfigureWindow(wid, {
                  width: (payload.width ?? win.outer.width) - win.frameExtents.left - win.frameExtents.right,
                  height: (payload.height ?? win.outer.height) - win.frameExtents.top - win.frameExtents.bottom,
                });
              }
            }
            break;
          case setFrameExtentsAction.type:
            {
              const state = getState();
              const wid = action.payload.wid;
              const win = state.windows[wid] as IWindow;
              const { width, height } = win.outer;
              const frameExtents = {
                left: action.payload.left,
                right: action.payload.right,
                top: action.payload.top,
                bottom: action.payload.bottom,
              };
              lastFrameExtents = frameExtents;

              X.ConfigureWindow(wid, {
                x: frameExtents.left,
                y: frameExtents.top,
                width: width - frameExtents.left - frameExtents.right,
                height: height - frameExtents.top - frameExtents.bottom,
              });

              eventConsumers.forEach((consumer) => consumer.onSetFrameExtents?.({ wid, frameExtents }));
            }
            break;
          case setScreenCurrentTagsAction.type:
            {
              const state = getState();
              const { currentTags, screenIndex } = action.payload as {
                currentTags: string[];
                screenIndex: number;
              };
              batch(() => {
                for (const widStr in state.windows) {
                  const wid = parseInt(widStr, 10);
                  const win = state.windows[widStr];
                  if (win.screenIndex !== screenIndex) {
                    continue; // Other screens not affected.
                  }
                  if (anyIntersect(win.tags, currentTags)) {
                    showWindow(wid);
                  } else {
                    hideWindow(wid);
                  }
                }
              });
            }
            break;
        }

        return returnValue;
      };
    };

    const middleware = [x11Middleware];
    const { consoleLogging, fileLogging } = getArgs();
    if (consoleLogging || fileLogging) {
      middleware.unshift(loggerMiddleware);
    }

    const store = configureWMStore(middleware);
    return store;
  }

  return server;
}

function getNativeWindowHandleInt(win: BrowserWindow): number {
  const hbuf = win.getNativeWindowHandle();
  return os.endianness() === "LE" ? hbuf.readInt32LE() : hbuf.readInt32BE();
}
