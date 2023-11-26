// This file is pretty messy, it is just a prototype for now!

const x11: IX11Mod = require("x11"); // eslint-disable-line

import * as path from "path";
import * as os from "os";
import { app, ipcMain, BrowserWindow } from "electron";
import {
  FrameModule,
  IBounds,
  IGeometry,
  LayoutPluginInstance,
  PluginInstance,
  selectConfigWithOverrides,
} from "@electron-wm/shared";
import { spawn } from "child_process";
import { AsyncReturnType, Writable } from "type-fest";
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
  IX11Client,
  XFocusRevertTo,
  PointerRoot,
  IXConfigureInfo,
  CWMaskBits,
  IClientMessageEvent,
  Atom,
  IXMotionNotifyEvent,
  IXButtonReleaseEvent,
  WMSizeHints,
  WMHintsStates,
} from "@electron-wm/shared";
import { Action, Middleware } from "redux";
import { batch } from "react-redux";
import { anyIntersect, arraysEqual, fitGeometryWithinAnother, intersect } from "@electron-wm/shared";
import { requireExt as requireXinerama } from "./xinerama";
import { createEWMHEventConsumer } from "./ewmh";
import { changeWindowEventMask, getPropertyValue, internAtomAsync } from "./xutils";
import { getScreenIndexWithCursor, queryPointer } from "./pointer";
import { createICCCMEventConsumer, getNormalHints, getWMClass, getWMHints, getWMTransientFor } from "./icccm";
import { createMotifModule, hasMotifDecorations } from "./motif";
import { ContextMenuKind } from "@electron-wm/shared";
import { showContextMenu } from "./menus";
import {
  addWindowAction,
  configureWindowAction,
  focusWindowAction,
  removeWindowAction,
  setFrameExtentsAction,
  setWindowFullscreenAction,
  setWindowIntoScreenAction,
  setWindowMaximizedAction,
  setWindowMinimizedAction,
  setWindowTagsAction,
  setWindowTitleAction,
  setWindowVisibleAction,
} from "@electron-wm/shared";
import { addScreenAction, setScreenCurrentTagsAction, setScreenZoomLevelAction } from "@electron-wm/shared";
import { getWindowMinHeight, getWindowMinWidth, IWindow, windowAcceptsFocus } from "@electron-wm/shared";
import { IScreen } from "@electron-wm/shared";
import { setupAutocompleteListener } from "./autocomplete";
import { switchToNextLayout } from "@electron-wm/shared";
import { customizeWindow } from "./customize";
import { createDragModule } from "./drag";
import { getArgs } from "./args";
import { createShortcutsModule } from "./shortcuts";
import { assert } from "./assert";
import { getConfig, loadConfigFromDisk } from "./config";
import { createTrayEventConsumer } from "./systray";
import { setupPackageInstallMessageListener } from "./npmPackageCache";
import { resolvePluginsForWM } from "./plugins";

// Path constants
const RENDERER_DESKTOP_INDEX_HTML = path.join(__dirname, "../../packages/react-desktop/index.html");
const PRELOAD_JS = path.resolve(path.join(__dirname, "../../packages/renderer-shared/dist/preload.js"));

// The values here are arbitrary; we call InternAtom to get the true constants.
export const ExtraAtoms = {
  UTF8_STRING: -1,

  WM_PROTOCOLS: 10000,
  WM_DELETE_WINDOW: 10001,

  _NET_WM_NAME: 340,
};

const NO_EVENT_MASK = x11.eventMask.None;

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
  /** Window id of the desktop window created for the screen. */
  desktopWindowId: number;
}

export interface XWMEventConsumerReduxActionArgs {
  action: Action & { payload: unknown };
  getState(): ServerRootState;
}

export interface XWMEventConsumerPointerMotionArgs extends XWMEventConsumerArgsWithType {
  rootx: number;
  rooty: number;
}

export interface XWMEventConsumerKeyPressArgs extends XWMEventConsumerArgsWithType {
  modifiers: X11_KEY_MODIFIER;
  keycode: number;
}

export interface IXWMEventConsumer {
  onScreenCreated?(args: XWMEventConsumerScreenCreatedArgs): void;
  onReduxAction?(args: XWMEventConsumerReduxActionArgs): void;

  onClientMessage?(args: XWMEventConsumerClientMessageArgs): void;
  onMapNotify?(args: XWMEventConsumerArgsWithType): void;
  onUnmapNotify?(args: XWMEventConsumerArgsWithType): void;
  onPointerMotion?(args: XWMEventConsumerPointerMotionArgs): void;
  onButtonRelease?(args: XWMEventConsumerArgsWithType): void;
  onKeyPress?(args: XWMEventConsumerKeyPressArgs): boolean;

  onSetFrameExtents?(args: XWMEventConsumerSetFrameExtentsArgs): void;
}

export interface XWMContext {
  X: IXClient;
  XDisplay: IXDisplay;
  store: ServerStore;

  getWindowIdFromFrameId(wid: number): number | undefined;
  getFrameIdFromWindowId(wid: number): number | undefined;
}

export function startX(): Promise<XServer> {
  return createServer();
}

export class XServer {
  // Could put a teardown method here.
}

export async function createServer(): Promise<XServer> {
  const server = new XServer();
  let client: IX11Client;

  let XDisplay: IXDisplay;
  let X: IXClient;

  const eventConsumers: IXWMEventConsumer[] = [];

  let ewmhModule: AsyncReturnType<typeof createEWMHEventConsumer>;
  let dragModule: AsyncReturnType<typeof createDragModule>;
  let motif: AsyncReturnType<typeof createMotifModule>;
  let shortcuts: AsyncReturnType<typeof createShortcutsModule>;

  let frameWindowSrc: string;
  const layoutsByScreen: Map<number, LayoutPluginInstance[]> = new Map();

  const knownWids = new Set<number>();
  const winIdToRootId: { [wid: number]: number } = {};

  const desktopBrowsers: (BrowserWindow | null)[] = [];
  /** Desktop window handle to index into `desktopBrowsers`. */
  const desktopBrowserHandles: { [did: number]: number } = {};
  const screenIndexToDesktopId: { [screenIndex: number]: number } = {};

  const frameBrowserWindows: { [wid: number]: BrowserWindow | undefined } = {};
  const frameBrowserWinIdToFrameId: { [wid: number]: number | undefined } = {};
  const frameBrowserFrameIdToWinId: { [fid: number]: number | undefined } = {};
  let frameBrowserOnDeck: { win: BrowserWindow; fid: number } | null = null;

  const initializingWins: { [win: number]: boolean } = {};

  let ignoreEnterLeave = false;

  /**
   * The last frame extents used for a window.
   * Since the frame takes a little bit to render, and the extents are usually the same,
   * we track this and use these extents as default as an optimization.
   */
  let lastFrameExtents: IBounds | undefined;

  const store = __setupStore();

  await loadConfigFromDisk(store);

  let context: XWMContext;

  const sendKeyToBrowser = async (args: XWMEventConsumerKeyPressArgs) => {
    const screenIndex = await getScreenIndexWithCursor(context, args.wid);
    const browser = desktopBrowsers[screenIndex];
    if (browser) {
      browser.webContents.send("x-keypress", {
        buttons: args.modifiers,
        keycode: args.keycode,
      });
    }
  };

  const registeredKeys: { [keyString: string]: (args: XWMEventConsumerKeyPressArgs) => void } = {
    "Mod4 + o": () => sendActiveWindowToNextScreen(),
    "Mod4 + r": sendKeyToBrowser,

    "Mod4 + Return": () => launchProcess(getConfig().term),
    "Mod4 + space": () => switchToNextLayoutWM(),

    "Mod4 + Shift + C": () => closeFocusedWindow(),
    "Mod4 + Shift + M": () => startDragFocusedWindow(),
    "Mod4 + Shift + Q": () => app.quit(),

    "Mod4 + Shift + F12": () => showDevtoolsForFocusedWindowFrame(),

    "Mod4 + Ctrl + r": () => {
      app.relaunch();
      app.exit(0);
    },
  };
  for (let i = 1; i <= 9; i++) {
    registeredKeys[`Mod4 + ${i}`] = async (args) => setTagIndexForActiveDesktop(i - 1, args.wid);
    registeredKeys[`Mod4 + Shift + ${i}`] = () => sendActiveWindowToTag(i - 1);
  }

  // Initialization.
  (() => {
    client = x11.createClient(async (err: unknown, display: IXDisplay) => {
      if (err || !display) {
        logError(err ?? "No display available.");
        process.exit(1);
      }

      XDisplay = display;
      X = display.client;

      context = {
        X,
        XDisplay,
        store,
        getWindowIdFromFrameId,
        getFrameIdFromWindowId,
      };

      dragModule = await createDragModule(context, (screenIndex) => layoutsByScreen.get(screenIndex));
      eventConsumers.push(dragModule);
      eventConsumers.push(await createICCCMEventConsumer(context));
      ewmhModule = await createEWMHEventConsumer(context, dragModule);
      eventConsumers.push(ewmhModule);
      eventConsumers.push(await createTrayEventConsumer(context));

      motif = await createMotifModule(context);
      shortcuts = await createShortcutsModule(context);
      eventConsumers.push(shortcuts);

      const frameConfig = store.getState().config.plugins?.frame;
      if (frameConfig) {
        const frameModule = await resolvePluginsForWM<PluginInstance<FrameModule>>(frameConfig);
        frameWindowSrc = frameModule[0]?.exports?.getFrameWindowSrc();
      }
      if (!frameWindowSrc) {
        throw new Error("Missing frame config. Frame windows cannot be created without frame config.");
      }

      await __setupAtoms();
      await __initDesktop();

      for (let s = 0; s < desktopBrowsers.length; s++) {
        const layoutPlugins = selectConfigWithOverrides(store.getState(), s).plugins?.layout;
        layoutsByScreen.set(s, layoutPlugins ? await resolvePluginsForWM<LayoutPluginInstance>(layoutPlugins) : []);
      }
    });

    client.on("error", logError);
    client.on("event", __onXEvent);

    ipcMain.on("raise-window", (event, wid) => {
      raiseWindow(wid);
    });

    ipcMain.on("minimize-window", (event, wid) => {
      minimize(wid);
    });

    ipcMain.on("maximize-window", (event, wid) => {
      maximize(wid);
    });

    ipcMain.on("restore-window", (event, wid) => {
      restore(wid);
    });

    ipcMain.on("close-window", (event, wid) => {
      closeWindow(wid);
    });

    ipcMain.on("focus-desktop-browser", (event, args: { screenIndex: number; takeVisualFocus?: boolean }) => {
      setFocusToDesktopWindow(args.screenIndex, args.takeVisualFocus);
    });

    ipcMain.on("frame-window-mouse-enter", (event, wid) => {
      // Alternative in case we don't receive PointerMotion over a window.
      if (ignoreEnterLeave) {
        widLog(wid, "frame-window-mouse-enter", "clearing enterleave ignore");
        ignoreEnterLeave = false;
      }
    });

    ipcMain.on("desktop-zoom-in", (event, args: { screenIndex: number }) => {
      desktopZoomIn(args.screenIndex);
    });

    ipcMain.on("desktop-zoom-out", (event, args: { screenIndex: number }) => {
      desktopZoomOut(args.screenIndex);
    });

    ipcMain.on("desktop-zoom-reset", (event, args: { screenIndex: number }) => {
      desktopZoomReset(args.screenIndex);
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
    setupPackageInstallMessageListener();
  })();

  async function __setupAtoms(): Promise<void> {
    // TODO: Typings are a little awkward here.
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const extraAtoms = ExtraAtoms as Writable<typeof ExtraAtoms>;
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

    // Set focus to the initial window/desktop.
    const firstDesktopWid = getNextFocusWidForScreen(0, undefined);
    if (typeof firstDesktopWid === "number") {
      setFocus(firstDesktopWid);
    }
  }

  async function __initScreen(screen: IXScreen): Promise<void> {
    const root = screen.root;

    const debugScreen = Object.assign({}, screen);
    delete (debugScreen as any).depths; // eslint-disable-line
    log("Processing X screen", debugScreen);

    X.GrabServer();

    changeWindowEventMask(X, root, ROOT_WIN_EVENT_MASK);

    X.UngrabServer();

    const logicalScreens = await getScreenGeometries(screen);
    log("Obtained logical screens", logicalScreens);

    const config = getConfig();

    for (const logicalScreen of logicalScreens) {
      store.dispatch(
        addScreenAction({
          x: logicalScreen.x,
          y: logicalScreen.y,
          width: logicalScreen.width,
          height: logicalScreen.height,
          root,
          tags: config.tags,
          initialTag: config.initialTag,
          initialLayout: config.initialLayout,
        })
      );

      const did = await createDesktopBrowser({
        x: logicalScreen.x,
        y: logicalScreen.y,
        width: logicalScreen.width,
        height: logicalScreen.height,
      });

      X.ReparentWindow(did, root, logicalScreen.x, logicalScreen.y);

      X.ConfigureWindow(did, {
        borderWidth: 0,
        x: logicalScreen.x,
        y: logicalScreen.y,
        width: logicalScreen.width,
        height: logicalScreen.height,
      });
    }

    X.QueryTree(root, (err, tree) => {
      tree.children.forEach((childWid) => manageWindow(childWid, { screenIndex: 0, checkUnmappedState: true }));
    });

    shortcuts.setupKeyShortcuts(root, registeredKeys);

    X.SetInputFocus(PointerRoot, XFocusRevertTo.PointerRoot);

    eventConsumers.forEach(
      (consumer) =>
        consumer.onScreenCreated?.({
          root,
          desktopWindowId: screenIndexToDesktopId[0],
        })
    );
  }

  function isDesktopBrowserWin(wid: number): boolean {
    return desktopBrowserHandles.hasOwnProperty(wid);
  }

  function isFrameBrowserWin(wid: number): boolean {
    return frameBrowserFrameIdToWinId.hasOwnProperty(wid) || frameBrowserOnDeck?.fid === wid;
  }

  function isTrayWin(wid: number): boolean {
    return wid in store.getState().tray.windows;
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

  async function createDesktopBrowser(props: IGeometry): Promise<number> {
    const win = new BrowserWindow({
      frame: false,
      fullscreen: true,
      width: props.width,
      height: props.height,
      x: props.x,
      y: props.y,
      type: "desktop",
      webPreferences: {
        preload: PRELOAD_JS,
        nodeIntegration: true,
        contextIsolation: false,
      },
    });

    const index = desktopBrowsers.length;
    desktopBrowsers[index] = win;

    const handle = getNativeWindowHandleInt(win);
    if (!handle) {
      logError("Browser handle was null");
    }
    desktopBrowserHandles[handle] = index;
    screenIndexToDesktopId[index] = handle;

    log("Created browser window", handle);

    const url = RENDERER_DESKTOP_INDEX_HTML + "?screen=" + index;
    await win.loadURL("file://" + url);

    const zoomLevel = win.webContents.getZoomLevel();
    if (zoomLevel !== 1) {
      store.dispatch(setScreenZoomLevelAction({ screenIndex: index, zoom: zoomLevel }));
    }

    // Uncomment to help debug total failures of the desktop window.
    // win.webContents.openDevTools({ mode: "right" });

    win.on("closed", function () {
      desktopBrowsers[index] = null;
    });

    return handle;
  }

  const FrameBrowserBaseProperties: Electron.BrowserWindowConstructorOptions = {
    frame: false,
    backgroundColor: "#00000000",
    transparent: true,
    hasShadow: false,
    webPreferences: {
      preload: PRELOAD_JS,
      nodeIntegration: true,
      contextIsolation: false,
    },
  };

  function createFrameBrowserOnDeck() {
    if (frameBrowserOnDeck) {
      return;
    }

    const win = new BrowserWindow({
      ...FrameBrowserBaseProperties,
      show: false,
    });
    win.loadURL(frameWindowSrc);

    const fid = getNativeWindowHandleInt(win);
    if (!fid) {
      logError("Frame window handle was null");
    }

    frameBrowserOnDeck = { win, fid };
  }

  function createFrameBrowser(wid: number, screen: IScreen, geometry: IGeometry) {
    // If we have a pre-made frame window, use it. Otherwise, create one.
    let win: BrowserWindow;
    let fid: number;
    if (frameBrowserOnDeck) {
      const onDeckInfo = frameBrowserOnDeck;
      frameBrowserOnDeck = null;
      win = onDeckInfo.win;
      fid = onDeckInfo.fid;

      win.setSize(geometry.width, geometry.height, false);
      win.setPosition(geometry.x, geometry.y, false);
      win.webContents.send("set-frame-wid", wid);
      win.webContents.setZoomLevel(screen.zoom);
      win.show();
    } else {
      win = new BrowserWindow({
        ...FrameBrowserBaseProperties,
        width: geometry.width,
        height: geometry.height,
        x: geometry.x,
        y: geometry.y,
      });
      win.webContents.on("did-finish-load", () => {
        win.webContents.setZoomLevel(screen.zoom);
      });
      win.loadURL(`${frameWindowSrc}?wid=${wid}`);

      fid = getNativeWindowHandleInt(win);
      if (!fid) {
        logError("Frame window handle was null");
      }
    }

    frameBrowserWindows[wid] = win;

    frameBrowserWinIdToFrameId[wid] = fid;
    frameBrowserFrameIdToWinId[fid] = wid;

    log("Created frame window", fid);

    if (!frameBrowserOnDeck) {
      setTimeout(() => createFrameBrowserOnDeck(), 0);
    }

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
    const { checkUnmappedState } = opts;
    let { screenIndex, focusWindow } = opts;

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
    if (isTrayWin(wid)) {
      log(`Skip manage, ${wid} is a tray window`);
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
      getWMHints(X, wid),
      getNormalHints(X, wid),
      motif.getMotifHints(wid),
      getWMTransientFor(X, wid),
      ewmhModule.getNetWmIcons(wid),
    ]);

    const [attrs, clientGeom, title, wmClass, wmHints, normalHints, motifHints, transientFor, icons] = values;
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
        transientFor,
        decorated: hasMotifDecorations(motifHints),
        title,
        wmClass,
        screenIndex,
        wmHints,
        normalHints,
        icons,
      };

      const state = store.getState();

      customizeWindow(win as IWindow);

      assert(typeof win.screenIndex === "number");
      assert(win.outer);

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

      const fid = createFrameBrowser(wid, screen, { ...win.outer, x: frameX, y: frameY });
      knownWids.add(fid);

      winIdToRootId[wid] = screen.root;
      winIdToRootId[fid] = screen.root;

      X.ReparentWindow(fid, screen.root, frameX, frameY);
      X.ReparentWindow(wid, fid, lastFrameExtents?.left || 0, lastFrameExtents?.top || 0);

      X.GrabServer();

      changeWindowEventMask(X, fid, FRAME_WIN_EVENT_MASK);
      changeWindowEventMask(X, wid, CLIENT_WIN_EVENT_MASK);

      X.UngrabServer();

      X.ConfigureWindow(fid, { borderWidth: 0, x: frameX, y: frameY });
      X.ConfigureWindow(wid, { borderWidth: 0 });

      store.dispatch(addWindowAction({ wid, ...win }));

      X.MapWindow(fid);

      if (focusWindow && !windowAcceptsFocus(win as IWindow)) {
        focusWindow = false;
      }
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
      if (typeof innerWid === "number") {
        delete frameBrowserWinIdToFrameId[innerWid];
        delete frameBrowserWindows[innerWid];
      }
    } else if (isClientWin(wid)) {
      widLog(wid, `Unmanage window`);

      const focusedWid = getFocusedWindowId();
      const win = getWinFromStore(wid);
      if (!win) {
        return;
      }

      store.dispatch(removeWindowAction(wid));

      const fid = getFrameIdFromWindowId(wid);
      if (typeof fid === "number" && fid !== wid) {
        // Reparent the hosted window back to the root before destroying the BrowserWindow.
        // This prevents a browser save popup closing from taking out the entire browser process for example.
        // (Presumably destroying the BrowserWindow with a window inside it triggers mass destruction.)
        const screen = store.getState().screens[win.screenIndex];
        X.ReparentWindow(wid, screen.root, 0, 0);

        log("Destroying BrowserWindow for frame " + fid);
        frameBrowserWindows[wid]?.destroy();
      }

      if (wid === focusedWid && win) {
        tryReplaceFocusForScreen(win.screenIndex, focusedWid);
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

  function getGeometryForWindow(clientGeom: XGeometry, normalHints: WMSizeHints | undefined): IGeometry {
    const effectiveGeometry = {
      height: clientGeom.height,
      width: clientGeom.width,
      x: clientGeom.xPos,
      y: clientGeom.yPos,
    };
    if (normalHints) {
      if (normalHints.maxHeight && normalHints.maxHeight > 0) {
        effectiveGeometry.height = Math.min(effectiveGeometry.height, normalHints.maxHeight);
      }
      if (normalHints.minHeight && normalHints.minHeight > 0) {
        effectiveGeometry.height = Math.max(effectiveGeometry.height, normalHints.minHeight);
      }
      if (normalHints.maxWidth && normalHints.maxWidth > 0) {
        effectiveGeometry.width = Math.min(effectiveGeometry.width, normalHints.maxWidth);
      }
      if (normalHints.minWidth && normalHints.minWidth > 0) {
        effectiveGeometry.width = Math.max(effectiveGeometry.width, normalHints.minWidth);
      }
    }

    return effectiveGeometry;
  }

  function runXCallsWithoutEvents(wid: number, fn: VoidFunction): void {
    X.GrabServer();
    try {
      const root = getRootIdFromWindowId(wid);
      if (typeof root === "number") {
        changeWindowEventMask(X, root, NO_EVENT_MASK);
      }
      const fid = getFrameIdFromWindowId(wid);
      if (typeof fid === "number") {
        changeWindowEventMask(X, fid, NO_EVENT_MASK);
      }
      changeWindowEventMask(X, wid, NO_EVENT_MASK);

      try {
        fn();
      } finally {
        if (typeof root === "number") {
          changeWindowEventMask(X, root, ROOT_WIN_EVENT_MASK);
        }
        if (typeof fid === "number") {
          changeWindowEventMask(X, fid, FRAME_WIN_EVENT_MASK);
        }
        changeWindowEventMask(X, wid, CLIENT_WIN_EVENT_MASK);
      }
    } finally {
      X.UngrabServer();
    }
  }

  async function onCreateNotify(ev: IXEvent) {
    const { wid } = ev;
    widLog(wid, "onCreateNotify", ev);

    const wmHints = await getWMHints(X, wid);
    if (knownWids.has(wid)) {
      widLog(wid, "onCreateNotify exiting after obtaining WM_HINTS; window was already managed.");
      return;
    }

    const initialState = wmHints?.initialState;
    if (typeof initialState === "number") {
      widLog(wid, `onCreateNotify initial state: ${initialState} (${WMHintsStates[initialState]})`);
      // if (initialState === WMHintsStates.IconicState) {
      //   const screenIndex = Math.max(0, await getScreenIndexWithCursor(context, wid));
      //   manageWindow(wid, { screenIndex, focusWindow: true, checkUnmappedState: false });
      // }
    }
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
    if (isFrameBrowserWin(wid)) {
      return;
    }

    if (!mask) {
      return; // There's no requested changes?
    }

    const config: Partial<IXConfigureInfo> = {};
    if (mask & CWMaskBits.CWX) {
      // ev.x is absolute, but our state is relative to the screen.
      config.x = ev.x;
    }
    if (mask & CWMaskBits.CWY) {
      config.y = ev.y;
    }
    if (mask & CWMaskBits.CWWidth) {
      config.width = ev.width;
    }
    if (mask & CWMaskBits.CWHeight) {
      config.height = ev.height;
    }
    if (mask & CWMaskBits.CWBorderWidth) {
      config.borderWidth = ev.borderWidth;
    }
    if (mask & CWMaskBits.CWSibling) {
      config.sibling = ev.sibling;
    }
    if (mask & CWMaskBits.CWStackMode) {
      // Don't allow the desktop to come to the front.
      if (!isDesktopBrowserWin(wid)) {
        config.stackMode = ev.stackMode;
      }
    }

    if (isClientWin(wid)) {
      const win = getWinFromStore(wid);
      if (!win) {
        return;
      }
      const screen = store.getState().screens[win.screenIndex];

      // ev.x|y is absolute, but our state is relative to the screen.
      if (mask & CWMaskBits.CWX) {
        config.x! -= screen.x;
      }
      if (mask & CWMaskBits.CWY) {
        config.y! -= screen.y;
      }

      if (Object.keys(config).length > 0) {
        store.dispatch(configureWindowAction({ wid, ...config }));
      }
    } else {
      // Some unmanaged window; pass the call through.
      X.ConfigureWindow(wid, config);
    }
  }

  function onEnterNotify(ev: IXEvent) {
    const { wid } = ev;
    widLog(wid, "onEnterNotify", ignoreEnterLeave ? "ignoring" : "handling");

    if (ignoreEnterLeave) {
      return;
    }

    focusWindowOnEnter(wid);
  }

  function focusWindowOnEnter(wid: number): void {
    const isFrame = isFrameBrowserWin(wid);
    const focusWid = isFrame ? getWindowIdFromFrameId(wid) : wid;
    if (typeof focusWid === "number") {
      const win = getWinFromStore(focusWid);
      if (win && windowAcceptsFocus(win)) {
        setFocus(focusWid);
      }
    }
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
      focusWindowOnEnter(wid); // In case we don't get onEnterNotify
    }

    eventConsumers.forEach(
      (consumer) =>
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

    for (const consumer of eventConsumers) {
      if (
        consumer.onKeyPress?.({
          wid,
          windowType: getWindowType(wid),
          modifiers: ev.buttons,
          keycode: ev.keycode,
        })
      ) {
        break; // Handled if returned true.
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

    raiseWindow(wid);

    widLog(wid, "onButtonPress", ev);
  }

  function onButtonRelease(ev: IXButtonReleaseEvent) {
    const { wid } = ev;
    widLog(wid, "onButtonRelease", ev);

    raiseWindow(wid);

    eventConsumers.forEach(
      (consumer) =>
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

    eventConsumers.forEach(
      (consumer) =>
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
          store.dispatch(setWindowTitleAction({ wid, title: title || "" }));
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

  /**
   * By default, one screen means one screen geometry.
   * But if Xinerama is in play, we may have multiple logical screens
   * represented within a single screen.
   */
  function getScreenGeometries(screen: IXScreen): Promise<IGeometry[]> {
    return new Promise((resolve) => {
      const defaultGeometry: IGeometry = {
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

  function getFocusedWindowId(screenIndex?: number): number | null {
    const windows = store.getState().windows;
    for (const widStr in windows) {
      const win = windows[widStr];
      if (win.focused) {
        if (typeof screenIndex !== "number" || win.screenIndex === screenIndex) {
          return parseInt(widStr);
        }
      }
    }
    return null;
  }

  /** Returns a window id if there is only one window in existence. */
  function getOnlyWindowId(): number | null {
    const windows = store.getState().windows;
    const wids = Object.keys(windows);
    if (wids.length === 1) {
      return parseInt(wids[0], 10);
    }
    return null;
  }

  function anyWindowHasFocus(screenIndex?: number): boolean {
    return typeof getFocusedWindowId(screenIndex) === "number";
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

  function showDevtoolsForFocusedWindowFrame(): void {
    const wid = getFocusedWindowId() ?? getOnlyWindowId();
    if (typeof wid === "number") {
      log(`Opening dev tools for ${wid}`);
      frameBrowserWindows[wid]?.webContents?.openDevTools({ mode: "detach" });
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
      return getNextFocusWidForScreen(win.screenIndex, widLosingFocus);
    }
    return nextFocusWid;
  }

  function getNextFocusWidForScreen(screenIndex: number, widLosingFocus: number | undefined): number | undefined {
    let nextFocusWid: number | undefined;
    const wins = store.getState().windows;
    for (const widStr in wins) {
      const otherWin = wins[widStr];
      if (
        otherWin.id !== widLosingFocus &&
        otherWin.screenIndex === screenIndex &&
        otherWin.visible &&
        windowAcceptsFocus(otherWin)
      ) {
        nextFocusWid = otherWin.id;

        // Not breaking here, on the chance that we end up finding the "most recent"
        // window later on in the enumeration. (Probably should implement some sort
        // of true "focus history" stack.)
      }
    }

    if (typeof nextFocusWid === "undefined") {
      nextFocusWid = screenIndexToDesktopId[screenIndex];
    }
    return nextFocusWid;
  }

  function tryReplaceFocusForScreen(screenIndex: number, widLosingFocus: number | undefined) {
    const nextFocusWid = getNextFocusWidForScreen(screenIndex, widLosingFocus);
    if (typeof nextFocusWid === "number") {
      setFocus(nextFocusWid);
    }
  }

  function showWindow(wid: number) {
    let fid;
    const isFrame = isFrameBrowserWin(wid);
    if (isFrame) {
      fid = wid;
      const trueWid = getWindowIdFromFrameId(wid);
      assert(typeof trueWid === "number");
      wid = trueWid;
    } else {
      fid = getFrameIdFromWindowId(wid);
    }

    if (typeof fid === "number") {
      log("showWindow frame id", fid);
      X.MapWindow(fid);
    }

    const win = getWinFromStore(wid);
    if (win?.minimized) {
      setWindowMinimized(wid, false);
    }
    if (win?.visible === false) {
      store.dispatch(setWindowVisibleAction({ wid, visible: true }));
    }

    log("showWindow id", wid);
    X.MapWindow(wid);
  }

  /** Hides a window without destroying its frame. */
  function hideWindow(wid: number): void {
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

  function raiseWindow(wid: number): void {
    if (isFrameBrowserWin(wid)) {
      const trueWid = getWindowIdFromFrameId(wid);
      assert(typeof trueWid === "number");
      wid = trueWid;
    }

    const win = getWinFromStore(wid);
    if (!win) {
      return;
    }

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
    }

    if (windowAcceptsFocus(win)) {
      setFocus(wid);
    }
  }

  function minimize(wid: number): void {
    widLog(wid, "minimize");
    setWindowMinimized(wid, true);
    hideWindow(wid);
  }

  function maximize(wid: number): void {
    widLog(wid, "maximize");
    setWindowMaximized(wid, true);
  }

  function restore(wid: number): void {
    widLog(wid, "restore");
    setWindowMaximized(wid, false);
  }

  function setWindowMinimized(wid: number, minimized: boolean): void {
    const win = getWinFromStore(wid);
    if (!win) {
      return;
    }

    if (win.minimized !== minimized) {
      store.dispatch(setWindowMinimizedAction({ wid, minimized }));
    }
  }

  function setWindowMaximized(wid: number, maximized: boolean): void {
    const win = getWinFromStore(wid);
    if (!win) {
      return;
    }

    if (win.maximized !== maximized) {
      store.dispatch(setWindowMaximizedAction({ wid, maximized }));
    }
  }

  function setFocus(wid: number): void {
    if (isClientWin(wid)) {
      setXInputFocus(wid);

      store.dispatch(focusWindowAction({ wid }));
    } else if (isDesktopBrowserWin(wid)) {
      setXInputFocus(wid);
    }
  }

  function setFocusToDesktopWindow(screenIndex: number, takeVisualFocus?: boolean | undefined) {
    const did = screenIndexToDesktopId[screenIndex];
    if (typeof did === "number") {
      if (takeVisualFocus) {
        store.dispatch(focusWindowAction({ wid: null }));
      }
      setFocus(did);
    }
  }

  function setXInputFocus(wid: number): void {
    widLog(wid, "Setting X input focus");

    X.SetInputFocus(wid, XFocusRevertTo.PointerRoot);
  }

  function sendActiveWindowToNextScreen(): void {
    const screens = store.getState().screens;
    const screenCount = screens.length;
    if (screenCount === 1) {
      return; // Only one screen, can't switch.
    }
    const wid = getFocusedWindowId();
    if (typeof wid !== "number") {
      return;
    }

    const win = getWinFromStore(wid);
    if (win) {
      const nextScreenIndex = (win.screenIndex + 1) % screenCount;
      batch(() => {
        // Update the window's tags if the next screen has different tags visible.
        const nextScreen = screens[nextScreenIndex];
        const nextScreenTags = nextScreen.currentTags;
        const tagIntersect = intersect(win.tags, nextScreenTags);
        if (tagIntersect.length > 0) {
          if (!arraysEqual(tagIntersect, win.tags)) {
            store.dispatch(setWindowTagsAction({ wid, tags: tagIntersect }));
          }
        } else if (nextScreenTags.length > 0) {
          store.dispatch(setWindowTagsAction({ wid, tags: [nextScreenTags[0]] }));
        }

        // Another window could move under our mouse; we don't want it to steal focus.
        ignoreEnterLeave = true;

        store.dispatch(setWindowIntoScreenAction({ wid, screenIndex: nextScreenIndex }));

        // The new screen may have different dimensions. Try to fit the window nicely within.
        const nextOuter = fitGeometryWithinAnother(nextScreen.workArea, win.outer, {
          width: getWindowMinWidth(win),
          height: getWindowMinHeight(win),
        });

        // Trigger reconfigure since coordinates have remained the same,
        // and we won't configure again otherwise (at least not if we are floating).
        store.dispatch(configureWindowAction({ wid, ...nextOuter }));
      });
    }
  }

  function sendActiveWindowToTag(tagIndex: number): void {
    const screens = store.getState().screens;
    const wid = getFocusedWindowId();
    if (typeof wid !== "number") {
      return;
    }
    const win = getWinFromStore(wid);
    if (!win) {
      return;
    }

    const screen = screens[win.screenIndex];
    if (!screen) {
      return;
    }

    const nextTag = getScreenTagByIndex(win.screenIndex, tagIndex);
    if (!nextTag || win.tags.includes(nextTag)) {
      return;
    }

    store.dispatch(setWindowTagsAction({ wid, tags: [nextTag] }));

    if (!screen.currentTags.includes(nextTag)) {
      hideWindow(wid);
      tryReplaceFocusForScreen(win.screenIndex, wid);
    }
  }

  async function setTagIndexForActiveDesktop(tagIndex: number, relativeWid: number): Promise<void> {
    const screenIndex = await getScreenIndexWithCursor(context, relativeWid);
    if (typeof screenIndex === "number") {
      const screen = store.getState().screens[screenIndex];
      const nextTag = getScreenTagByIndex(screenIndex, tagIndex);
      if (!nextTag || arraysEqual(screen.currentTags, [nextTag])) {
        return;
      }
      store.dispatch(setScreenCurrentTagsAction({ screenIndex, currentTags: [nextTag] }));
    }
  }

  function getScreenTagByIndex(screenIndex: number, tagIndex: number): string | undefined {
    const screens = store.getState().screens;
    const screen = screens[screenIndex];
    return screen?.tags[tagIndex];
  }

  function desktopZoomIn(screenIndex: number): void {
    const browser = desktopBrowsers[screenIndex];
    if (browser) {
      setScreenZoomLevel(screenIndex, browser.webContents.getZoomLevel() + 1);
    }
  }

  function desktopZoomOut(screenIndex: number): void {
    const browser = desktopBrowsers[screenIndex];
    if (browser) {
      setScreenZoomLevel(screenIndex, browser.webContents.getZoomLevel() - 1);
    }
  }

  function desktopZoomReset(screenIndex: number): void {
    setScreenZoomLevel(screenIndex, 0);
  }

  function setScreenZoomLevel(screenIndex: number, zoomLevel: number): void {
    const browser = desktopBrowsers[screenIndex];
    if (browser) {
      browser.webContents.setZoomLevel(zoomLevel);
    }

    setFrameWindowsZoomLevel(screenIndex, zoomLevel);
    store.dispatch(setScreenZoomLevelAction({ screenIndex, zoom: zoomLevel }));

    log(`Set zoom level to ${zoomLevel} (for ${screenIndex})`);
  }

  function setFrameWindowsZoomLevel(screenIndex: number, zoomLevel: number): void {
    const state = store.getState();
    for (const widStr in state.windows) {
      const wid = parseInt(widStr, 10);
      const win = state.windows[widStr];
      if (win.screenIndex !== screenIndex) {
        continue;
      }
      const frameWin = frameBrowserWindows[wid];
      frameWin?.webContents?.setZoomLevel(zoomLevel);
    }
  }

  async function switchToNextLayoutWM(): Promise<void> {
    const screens = store.getState().screens;
    let screenIndex = 0;
    if (screens.length > 1) {
      screenIndex = Math.max(0, await getScreenIndexWithCursor(context, screens[0].root));
    }
    const layouts = layoutsByScreen.get(screenIndex);
    if (layouts) {
      switchToNextLayout(store, layouts, screenIndex);
    }
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

  function configureWindow(wid: number, fid: number, win: IWindow, frameConfig: IGeometry): void {
    X.ConfigureWindow(fid, frameConfig);

    if (fid !== wid && win) {
      X.ConfigureWindow(wid, {
        width: win.outer.width - win.frameExtents.left - win.frameExtents.right,
        height: win.outer.height - win.frameExtents.top - win.frameExtents.bottom,
      });
    }
  }

  function configureToCurrentSize(state: ServerRootState, wid: number): void {
    const win = state.windows[wid];
    const screen = state.screens[win.screenIndex];
    const fid = getFrameIdFromWindowId(wid) ?? wid;
    const frameConfig = {
      x: screen.x + win.outer.x,
      y: screen.y + win.outer.y,
      width: win.outer.width,
      height: win.outer.height,
    };
    widLog(fid, "Configuring window to current size", frameConfig);
    configureWindow(wid, fid, win, frameConfig);
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
              const payload: Partial<IGeometry> = action.payload;
              const wid = action.payload.wid;
              const win = state.windows[wid];
              const screen = state.screens[win.screenIndex];

              const frameConfig: Partial<IGeometry> = {};
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

              const fid = getFrameIdFromWindowId(wid) ?? wid;
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
          case setWindowMaximizedAction.type:
            {
              // Restore the window to its location prior to going maximized.
              // We need to do this here since some layouts (floating) won't bother to move the window.
              const { wid, maximized } = action.payload as { wid: number; maximized: boolean };
              if (!maximized) {
                configureToCurrentSize(getState(), wid);
              }
            }
            break;
          case setWindowFullscreenAction.type:
            {
              // Restore the window to its location prior to going fullscreen.
              const { wid, fullscreen } = action.payload as { wid: number; fullscreen: boolean };
              if (!fullscreen) {
                configureToCurrentSize(getState(), wid);
              }
            }
            break;
          case setFrameExtentsAction.type:
            {
              const state = getState();
              const wid = action.payload.wid;
              const win = state.windows[wid];
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
          case setWindowIntoScreenAction.type:
            {
              const state = getState();
              const { wid, screenIndex } = action.payload;
              const screen = state.screens[screenIndex];

              // Update the frame window's zoom level to match the screen zoom level, if it differs.
              const frameWin = frameBrowserWindows[wid];
              if (frameWin && frameWin.webContents && frameWin.webContents.zoomLevel !== screen.zoom) {
                frameWin?.webContents.setZoomLevel(screen.zoom);
              }
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
                let hidFocusedWid: number | undefined = undefined;
                for (const widStr in state.windows) {
                  const wid = parseInt(widStr, 10);
                  const win = state.windows[widStr];
                  if (win.screenIndex !== screenIndex) {
                    continue; // Other screens not affected.
                  }
                  if (anyIntersect(win.tags, currentTags)) {
                    if (!win.minimized) {
                      showWindow(wid);
                    }
                  } else {
                    if (win.focused) {
                      hidFocusedWid = wid;
                    }
                    hideWindow(wid);
                  }
                }

                if (typeof hidFocusedWid === "number" || !anyWindowHasFocus()) {
                  tryReplaceFocusForScreen(screenIndex, hidFocusedWid);
                }
              });
            }
            break;

          default:
            eventConsumers.forEach((consumer) => consumer.onReduxAction?.({ action, getState }));
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
