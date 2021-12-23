// This file is pretty messy, it is just a prototype for now!

import { app, ipcMain, BrowserWindow } from "electron";
import type { IWindow } from "../shared/reducers";

import * as path from "path";
import * as url from "url";
import * as os from "os";
import { spawn } from "child_process";
import { EventEmitter } from "events";
const x11 = require("x11");

import { configureStore, ServerStore } from "./configureStore";
import { X11_EVENT_TYPE, X11_KEY_MODIFIER, IXEvent, IXConfigureEvent, IXScreen, IXDisplay, IXClient, IXKeyEvent, XCbWithErr, XGeometry, XWindowAttrs } from "../shared/X";
import * as actions from "../shared/actions";
import { Middleware } from "redux";

const registeredKeys: { [keyModifiers: number]: { [keyCode: number]: boolean } } = {
  [X11_KEY_MODIFIER.Mod4Mask]: {
    27: true // Win + R
  },
  [X11_KEY_MODIFIER.Mod4Mask | X11_KEY_MODIFIER.ShiftMask]: {
    24: true // Win + Shift + Q
  },
  [X11_KEY_MODIFIER.Mod4Mask | X11_KEY_MODIFIER.ControlMask]: {
    27: true // Win + Ctrl + R
  }
};

interface Geometry {
  width: number;
  height: number;
  x: number;
  y: number;
}

export function startX(): XServer {
  return createServer();
}

export class XServer {
  // Could put a teardown method here.
}

export function createServer(): XServer {
  const server = new XServer();
  let client: any;

  let XDisplay: IXDisplay;
  let X: IXClient;

  const knownWids = new Set<number>();

  const desktopBrowsers: BrowserWindow[] = [];
  const desktopBrowserHandles: { [did: number]: any } = {};

  const frameBrowsers: BrowserWindow[] = [];
  const frameBrowserWindows: { [wid: number]: BrowserWindow | undefined } = {};
  const frameBrowserWinIdToFrameId: { [wid: number]: number | undefined } = {};
  const frameBrowserFrameIdToWinId: { [fid: number]: number | undefined } = {};

  var root: number;
  let white: unknown;

  const initializingWins: { [win: number]: any } = {};

  const store = __setupStore();

  // Initialization.
  (() => {
    client = x11.createClient(async (err: unknown, display: IXDisplay) => {
      if (err) {
        console.error(err);
        process.exit(1);
      }

      XDisplay = display;
      X = display.client;

      await __initDesktop();
    });

    client.on("error", (err: unknown) => {
      console.error(err);
    });

    client.on("event", __onXEvent);

    ipcMain.on("raise-window", (event, wid) => {
      raiseWindow(wid);
      changeFocus(wid);
    });

    ipcMain.on("minimize-window", (event, wid) => {
      minimize(wid);
    });

    ipcMain.on("focus-window", (event, wid) => {
      changeFocus(wid);
    });

    ipcMain.on("close-window", (event, wid) => {
      closeWindow(wid);
    });

    ipcMain.on("exec", (event, args) => {
      launchProcess(args.executable);
    });
  })();

  async function __initDesktop(): Promise<void> {
    for (const screen of XDisplay.screen) {
      await __initScreen(screen);
    }
  }

  async function __initScreen(screen: IXScreen): Promise<void> {
    const props = {
      width: screen.pixel_width,
      height: screen.pixel_height
    };

    console.log("Adding screen", props);

    store.dispatch(actions.addScreen(props));

    createDesktopBrowser(props);

    root = screen.root;
    console.log("Root wid", root);
    white = screen.white_pixel;

    X.GrabServer();

    const rootEvents = x11.eventMask.SubstructureRedirect
      | x11.eventMask.SubstructureNotify
      | x11.eventMask.EnterWindow
      | x11.eventMask.LeaveWindow
      | x11.eventMask.StructureNotify
      | x11.eventMask.ButtonPress
      | x11.eventMask.ButtonRelease
      | x11.eventMask.FocusChange
      | x11.eventMask.PropertyChange;
    await changeWindowEventMask(root, rootEvents);

    X.UngrabServer();

    // X.QueryTree(root, (err, tree) => {
    //   tree.children.forEach(manageWindow);
    // });

    for (let modifier in registeredKeys) {
      if (!registeredKeys.hasOwnProperty(modifier))
        continue;

      for (let key in registeredKeys[modifier]) {
        if (!registeredKeys[modifier].hasOwnProperty(key))
          continue;

        X.GrabKey(root, true, parseInt(modifier), parseInt(key), 1 /* Async */, 1 /* Async */);
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

  function createDesktopBrowser(props: { width: number, height: number }) {
    const win = new BrowserWindow({
      frame: false,
      fullscreen: true,
      width: props.width,
      height: props.height,
      webPreferences: {
        preload: path.resolve(path.join(__dirname, "../renderer-shared/preload.js")),
        nodeIntegration: true,
        contextIsolation: false,
      },
    });

    let index = desktopBrowsers.length;
    desktopBrowsers[index] = win;

    const url = path.join(__dirname, "../renderer-desktop/index.html") + "?screen=" + index;
    win.loadURL("file://" + url);

    const handle = getNativeWindowHandleInt(win);
    if (!handle) {
      console.error("Browser handle was null");
    }
    desktopBrowserHandles[handle] = index;

    console.log("Created browser window", handle);

    win.on("closed", function () {
      desktopBrowsers[index] = null;
    });

    // Open the DevTools.
    win.webContents.openDevTools();

    return handle;
  }

  function createFrameBrowser(wid: number, geometry: Geometry) {
    const win = new BrowserWindow({
      frame: false,
      width: geometry.width,
      height: geometry.height,
      x: geometry.x,
      y: geometry.y,
      webPreferences: {
        preload: path.resolve(path.join(__dirname, "../renderer-shared/preload.js")),
        nodeIntegration: true,
        contextIsolation: false,
      },
    });

    const url = path.join(__dirname, "../renderer-frame/index.html") + "?wid=" + wid;
    win.loadURL("file://" + url);

    let index = frameBrowsers.length;
    frameBrowsers[index] = win;
    frameBrowserWindows[wid] = win;

    const fid = getNativeWindowHandleInt(win);
    if (!fid) {
      console.error("Frame window handle was null");
    }
    frameBrowserWinIdToFrameId[wid] = fid;
    frameBrowserFrameIdToWinId[fid] = wid;

    console.log("Created frame window", fid, url);

    win.on("closed", function () {
      frameBrowsers[index] = null;
    });

    // Open the DevTools.
    //win.webContents.openDevTools({ mode: "undocked" });

    return fid;
  }

  function __onXEvent(ev: IXEvent) {
    switch (ev.type) {
      case X11_EVENT_TYPE.KeyPress:
        onKeyPress(ev as IXKeyEvent);
        break;
      case X11_EVENT_TYPE.KeyRelease:
        break; // ignore
      case X11_EVENT_TYPE.ButtonPress:
        onButtonPress(ev);
        break;
      case X11_EVENT_TYPE.MotionNotify:
        break; // ignore
      case X11_EVENT_TYPE.EnterNotify:
        onEnterNotify(ev);
        break;
      case X11_EVENT_TYPE.LeaveNotify:
        onLeaveNotify(ev);
        break;
      case X11_EVENT_TYPE.FocusIn:
        log(ev.wid, "onFocusIn", ev);
        break; // ignore
      case X11_EVENT_TYPE.FocusOut:
        log(ev.wid, "onFocusOut", ev);
        break; // ignore
      case X11_EVENT_TYPE.Expose:
        log(ev.wid, "onExpose", ev);
        break; // ignore
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
        break; // ignore
      case X11_EVENT_TYPE.MapRequest:
        onMapRequest(ev);
        break;
      case X11_EVENT_TYPE.ReparentNotify:
        log(ev.wid, "onReparentNotify", ev);
        break; // ignore
      case X11_EVENT_TYPE.ConfigureNotify:
        break; // ignore
      case X11_EVENT_TYPE.ConfigureRequest:
        onConfigureRequest(ev as IXConfigureEvent);
        break;
      case X11_EVENT_TYPE.ClientMessage:
        onClientMessage(ev);
        break;
      default:
        console.log("Unhandled event", ev);
        if (!ev.name) console.log(ev);
        break;
    }
  }

  async function manageWindow(wid: number): Promise<void> {
    console.log("MANAGE WINDOW: " + wid);

    if (initializingWins[wid]) {
      console.log(`Skip manage, ${wid} is already initializing`);
      return;
    }
    if (knownWids.has(wid)) {
      console.log(`Skip manage, ${wid} is known`);
      return;
    }
    if (isFrameBrowserWin(wid)) {
      console.log(`Skip manage, ${wid} is a frame window`);
      return;
    }

    // Make sure we don't respond to too many messages at once.
    initializingWins[wid] = true;
    knownWids.add(wid);

    const values = await Promise.all([
      determineWindowAttributes(wid),
      determineWindowGeometry(wid),
      determineWindowTitle(wid),
      determineWindowDecorated(wid)
    ]);

    const [attrs, clientGeom, title, decorated] = values;
    console.log(`got values for ${wid}:`, values);

    if (attrs.overrideRedirect === 1) {
      console.log("don't manage " + wid);
      X.MapWindow(wid);
      return;
    }

    X.ChangeSaveSet(1, wid);

    if (shouldCreateFrame(wid, clientGeom)) {
      const effectiveGeometry = getGeometryForWindow(clientGeom, title);

      const fid = createFrameBrowser(wid, effectiveGeometry);
      knownWids.add(fid);

      store.dispatch(actions.addWindow({
        wid,
        x: effectiveGeometry.x,
        y: effectiveGeometry.y,
        width: effectiveGeometry.width,
        height: effectiveGeometry.height,
        visible: true,
        decorated,
        title,
      }));

      X.GrabServer();

      const frameEvents = x11.eventMask.StructureNotify
        | x11.eventMask.EnterWindow
        | x11.eventMask.LeaveWindow
        | x11.eventMask.Exposure
        | x11.eventMask.SubstructureRedirect
        | x11.eventMask.PointerMotion
        | x11.eventMask.ButtonPress
        | x11.eventMask.ButtonRelease;
      await changeWindowEventMask(fid, frameEvents);

      const clientEvents = x11.eventMask.StructureNotify
        | x11.eventMask.PropertyChange
        | x11.eventMask.FocusChange;
      await changeWindowEventMask(wid, clientEvents);

      X.UngrabServer();

      X.ReparentWindow(fid, root, effectiveGeometry.x, effectiveGeometry.y);
      X.ReparentWindow(wid, fid, 0, 0);

      // X.ConfigureWindow(fid, {
      //   x: effectiveGeometry.x,
      //   y: effectiveGeometry.y,
      //   width: effectiveGeometry.width,
      //   height: effectiveGeometry.height,
      // });
      // X.ConfigureWindow(wid, {
      //   x: 0,
      //   y: 0,
      //   width: effectiveGeometry.width,
      //   height: effectiveGeometry.height,
      //   borderWidth: 0,
      // });
      X.ConfigureWindow(wid, {
        borderWidth: 0,
      });

      X.MapWindow(fid);

      // const ee = new EventEmitter();
      // ee.on("event", __onXEvent);
      // X.event_consumers[fid] = ee;
    }

    console.log("Initial map of wid", wid);
    X.MapWindow(wid);

    delete initializingWins[wid];
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

  function getGeometryForWindow(clientGeom: XGeometry, title: string | undefined): Geometry {
    switch (title) {
      case "xterm":
        return {
          height: 200,
          width: 300,
          x: 50,
          y: 50,
        };
    }

    return {
      height: clientGeom.height,
      width: clientGeom.width,
      x: clientGeom.xPos,
      y: clientGeom.yPos,
    };
  }

  function changeWindowEventMask(wid: number, eventMask: any): Promise<void> {
    return new Promise((resolve, reject) => {
      let failed;
      console.log("Changing event mask for", wid, eventMask);
      X.ChangeWindowAttributes(wid, { eventMask }, (err: any) => {
        if (err && err.error === 10) {
          console.error(`Error for ${wid}: Another window manager already running.`);
          reject(err);
          failed = true;
          return;
        }
        console.error('Error: Error in root event masking');
        reject(err);
        failed = true;
      });
      if (!failed) {
        resolve();
      }
    });
  }

  function onCreateNotify(ev: IXEvent) {
    const wid = ev.wid;
    log(wid, "onCreateNotify", ev);
  }

  function onDestroyNotify(ev: IXEvent) {
    const wid = ev.wid;
    log(wid, "onDestroyNotify", ev);

    if (!isFrameBrowserWin(ev.wid)) {
      store.dispatch(actions.removeWindow(ev.wid));
    }

    const fid = getFrameIdFromWindowId(wid);
    if (typeof fid === "number" && fid !== wid) {
      X.DestroyWindow(fid);
    }
  }

  function onMapRequest(ev: IXEvent) {
    const wid = ev.wid;
    log(wid, "onMapRequest", ev);

    if (initializingWins[wid])
      return;

    if (knownWids.has(wid)) {
      showWindow(wid);
    }
    else {
      manageWindow(wid);
    }
  }

  function showWindow(wid: number) {
    let fid;
    const isFrame = isFrameBrowserWin(wid);
    if (isFrame) {
      fid = wid;
      wid = getWindowIdFromFrameId(wid);
    }
    else {
      fid = getFrameIdFromWindowId(wid);
    }

    if (typeof fid === "number") {
      console.log("showWindow frame id", fid);
      X.MapWindow(fid);
    }

    if (!isDesktopBrowserWin(wid)) {
      store.dispatch(actions.setWindowVisible(wid, true));
    }

    console.log("showWindow id", wid);
    X.MapWindow(wid);
  }

  function onUnmapNotify(ev: IXEvent) {
    const wid = ev.wid;
    log(wid, "onUnmapNotify", ev);
    if (!isFrameBrowserWin(wid) && !isDesktopBrowserWin(wid)) {
      store.dispatch(actions.setWindowVisible(wid, false));

      const fid = getFrameIdFromWindowId(wid);
      if (typeof fid === "number" && fid !== wid) {
        X.UnmapWindow(fid);
      }
    }
  }

  function onConfigureRequest(ev: IXConfigureEvent) {
    const { wid } = ev;
    log(wid, "onConfigureRequest", ev);
    if (isDesktopBrowserWin(wid)) {
      return;
    }

    return;

    const config = {
      x: ev.x,
      y: ev.y,
      width: ev.width,
      height: ev.height,
      //borderWidth: 0, // No borders
      //sibling: ev.sibling,
      //stackMode: ev.stackMode
    };
    const innerConfig = Object.assign({}, config, { x: 5, y: 10 });

    const isFrame = isFrameBrowserWin(ev.wid);
    if (isFrame) {
      //frameBrowserWindows[ev.wid].setPos
      // X.ConfigureWindow(frames[ev.wid], config);
    }
    else {
      X.ConfigureWindow(getFrameIdFromWindowId(ev.wid), config);
      X.ConfigureWindow(ev.wid, innerConfig);
    }

    store.dispatch(actions.configureWindow(ev.wid, config));
  }

  function onEnterNotify(ev: IXEvent) {
    const { wid } = ev;
    log(wid, "onEnterNotify", ev);

    const isFrame = isFrameBrowserWin(wid);
    let window = isFrame ? getWindowIdFromFrameId(wid) : wid;

    changeFocus(window);
  }

  function changeFocus(wid: number) {
    unsetFocus();

    X.SetInputFocus(wid, 0);

    if (!isDesktopBrowserWin(wid) && wid !== root) {
      store.dispatch(actions.focusWindow(wid));
    }
  }

  function unsetFocus() {
    const focusedWindow = getFocusedWindow();
    if (focusedWindow) {
      store.dispatch(actions.unfocusWindow(focusedWindow));
    }
  }

  function onLeaveNotify(ev: IXEvent) {
    const { wid } = ev;
    log(wid, "onLeaveNotify", ev);
    // if (!isBrowserWin(ev.wid)) {
    //   const isFrame = !!frames[ev.wid];
    //   let window = isFrame ? frames[ev.wid] : ev.wid;
    //   store.dispatch(actions.unfocusWindow(window));
    // }
  }

  function onKeyPress(ev: IXKeyEvent) {
    const { wid } = ev;
    log(wid, "onKeyPress", ev);

    const kb = registeredKeys;
    if (kb[ev.buttons] && kb[ev.buttons][ev.keycode]) {
      const browser = desktopBrowsers[0];
      if (browser) {
        browser.webContents.send("x-keypress", {
          buttons: ev.buttons,
          keycode: ev.keycode,
        });
      }
    }

    switch (ev.buttons) {
      case (X11_KEY_MODIFIER.Mod4Mask | X11_KEY_MODIFIER.ShiftMask):
        // Win + Shift + Q
        if (ev.keycode === 24) {
          app.quit();
        }
        break;
      case (X11_KEY_MODIFIER.Mod4Mask | X11_KEY_MODIFIER.ControlMask):
        // Win + Ctrl + R
        if (ev.keycode === 27) {
          app.relaunch();
          app.exit(0);
        }
        break;
    }
  }

  function onButtonPress(ev: IXEvent) {
    const { wid } = ev;
    log(wid, "onButtonPress", ev);

    if (isDesktopBrowserWin(ev.wid))
      return;
    // X.RaiseWindow(ev.wid);
  }

  function onClientMessage(ev: IXEvent) {
    const { wid } = ev;
    log(wid, "onClientMessage", ev);

    // ClientMessage
    // minimize
    // { type: 33,
    //   seq: 60,
    //   name: 'ClientMessage',
    //   format: 32,
    //   wid: 14680072,
    //   message_type: 468,
    //   data: [ 3, 0, 0, 0, 0 ],
    //   rawData: <Buffer a1 20 3c 00 08 00 e0 00 d4 01 00 00 03 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00> }
  }

  function launchProcess(name: string) {
    const child = spawn(name, [], {
      detached: true,
      stdio: "ignore"
    });
    child.unref(); // Allow electron to close before this child
  }

  function determineWindowAttributes(wid: number): Promise<XWindowAttrs> {
    return new Promise((resolve, reject) => {
      X.GetWindowAttributes(wid, function (err: unknown, attrs) {
        if (err) {
          console.error("Couldn't GetWindowAttributes", wid, err);
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
          console.error("Couldn't read geometry", err);
          reject(err);
          return;
        }

        resolve(clientGeom);
      });
    });
  }

  function determineWindowTitle(wid: number): Promise<string | undefined> {
    return new Promise((resolve, reject) => {
      X.GetProperty(0, wid, X.atoms.WM_NAME, X.atoms.STRING, 0, 10000000, function (err, prop) {
        if (err) {
          reject(err);
          return;
        }

        if (prop.type == X.atoms.STRING) {
          const dataString = prop.data.toString();
          if (dataString) {
            resolve(dataString);
          }
        }
        resolve(undefined);
      });
    });
  }

  function determineWindowDecorated(wid: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      X.InternAtom(true, "_MOTIF_WM_HINTS", (err, atom) => {
        if (err) {
          console.error("InternAtom _MOTIF_WM_HINTS error", err);
          reject(err);
          return;
        }

        X.GetProperty(0, wid, atom, 0, 0, 10000000, (err, prop) => {
          if (err) {
            console.error("GetProperty _MOTIF_WM_HINTS error", err);
            reject(err);
            return;
          }

          let buffer = prop.data;
          if (buffer && buffer.length) {
            if (buffer[0] === 0x02) { // Specifying decorations
              if (buffer[2] === 0x00) { // No decorations
                resolve(false);
              }
            }
          }
          resolve(true);
        });
      });
    });
  }

  //function determineWindowHidden(wid: number) {
    // X.InternAtom(true, "_NET_WM_ICON", function(err, atom) {
    //   X.GetProperty(0, wid, atom, 0, 0, 10000000, function(err, prop) {
    //     if (err) {
    //       console.error("GetProperty _NET_WM_ICON error", err);
    //       return;
    //     }
    //     console.log(prop);
    //     // let buffer = prop.data;
    //     // if (buffer && buffer.length) {
    //     //   if (buffer[0] === 0x02) { // Specifying decorations
    //     //     if (buffer[2] === 0x00) { // No decorations
    //     //       store.dispatch(actions.setWindowDecorated(wid, false));
    //     //     }
    //     //   }
    //     // }
    //   });
    // });
  //}

  function getFocusedWindow() {
    let windows = store.getState().windows;
    for (let wid in windows) {
      if (windows[wid].focused)
        return parseInt(wid);
    }
    return null;
  }

  function XGetWMProtocols(wid: number, callback: XCbWithErr<[number[] | void]>) {
    X.InternAtom(true, "WM_PROTOCOLS", (err, atom) => {
      if (err) {
        callback(err);
        return;
      }

      X.GetProperty(0, wid, atom, 0, 0, 10000000, (err, prop) => {
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
    });
  }

  function closeWindow(wid: number) {
    supportsGracefulDestroy(wid, (err, args) => {
      if (err) {
        console.log("Error in supportsGracefulDestroy", err);
      }
      if (args && args.supported) {
        const eventData = Buffer.alloc(32);
        eventData.writeUInt8(33, 0); // Event Type 33 = ClientMessage
        eventData.writeUInt8(32, 1); // Format
        eventData.writeUInt32LE(wid, 4); // Window ID
        eventData.writeUInt32LE(args.atom as number, 8); // Message Type
        console.log("Sending graceful kill", wid, eventData);
        X.SendEvent(wid, false, 0, eventData);

        X.KillClient(wid); // TODO: Above isn't working
      }
      else {
        console.log("Killing window client", wid);
        X.KillClient(wid);
      }
    });
  }

  function supportsGracefulDestroy(wid: number, callback: XCbWithErr<[{ atom: unknown, supported: boolean } | void]>) {
    XGetWMProtocols(wid, (err, protocols) => {
      if (err) {
        console.error("XGetWMProtocols error", err);
        callback(err);
        return;
      }

      X.InternAtom(true, "WM_DELETE_WINDOW", (err: unknown, atom) => {
        if (err) {
          callback(err);
          return;
        }

        callback(null, {
          atom: atom,
          supported: !!protocols && protocols.indexOf(atom as number) >= 0
        });
      });
    });
  }

  function raiseWindow(wid: number) {
    let windows = store.getState().windows;
    let window = windows[wid];

    if (!window.visible) {
      showWindow(wid);
    }
    else {
      const fid = getFrameIdFromWindowId(wid);
      if (fid)
        X.RaiseWindow(fid);
      if (wid)
        X.RaiseWindow(wid);
    }
  }

  function minimize(wid: number) {
    const fid = getFrameIdFromWindowId(wid);
    if (fid)
      X.UnmapWindow(fid);
    if (wid)
      X.UnmapWindow(wid);

    unsetFocus();
  }

  function log(wid: number, ...args: any[]): void {
    let details = [];
    if (typeof wid === "number") {
      details.push(wid);

      if (isFrameBrowserWin(wid)) {
        details.push(`(frame for ${getWindowIdFromFrameId(wid)})`);
      }
      if (isDesktopBrowserWin(wid)) {
        details.push("(desktop)");
      }
    }

    const logArgs = [...details, ...args];
    console.log(...logArgs);
  }

  function __setupStore(): ServerStore {
    const loggerMiddleware: Middleware = function ({ getState }) {
      return next => action => {
        console.log("will dispatch", action);

        // Call the next dispatch method in the middleware chain.
        const returnValue = next(action);

        console.log("state after dispatch", getState());

        // This will likely be the action itself, unless
        // a middleware further in chain changed it.
        return returnValue;
      }
    }

    const x11Middleware: Middleware = function ({ getState }) {
      return next => action => {
        const returnValue = next(action);

        switch (action.type) {
          case "CONFIGURE_WINDOW":
            {
              const fid = getFrameIdFromWindowId(action.payload.wid) ?? action.payload.wid;
              X.ConfigureWindow(fid, {
                x: action.payload.x,
                y: action.payload.y,
                width: action.payload.width,
                height: action.payload.height,
              });
              if (fid !== action.payload.wid) {
                const state = getState();
                const win = state.windows[action.payload.wid] as IWindow;
                X.ConfigureWindow(action.payload.wid, {
                  width: action.payload.width - win.inner.left - win.inner.right,
                  height: action.payload.height - win.inner.top - win.inner.bottom,
                });
              }
            }
            break;
          case "CONFIGURE_INNER_WINDOW":
            {
              const state = getState();
              const win = state.windows[action.payload.wid] as IWindow;
              const { width, height } = win.outer;
              X.ConfigureWindow(action.payload.wid, {
                x: action.payload.left,
                y: action.payload.top,
                width: width - action.payload.left - action.payload.right,
                height: height - action.payload.top - action.payload.bottom,
              });
            }
            break;
        }

        return returnValue;
      }
    }

    const store = configureStore([loggerMiddleware, x11Middleware]);
    return store;
  }

  return server;
}

function getNativeWindowHandleInt(win: BrowserWindow): number {
  const hbuf = win.getNativeWindowHandle();
  return os.endianness() === "LE" ? hbuf.readInt32LE() : hbuf.readInt32BE();
}