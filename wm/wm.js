// This file is pretty messy, it is just a prototype for now!

const electron = require("electron");
const BrowserWindow = electron.BrowserWindow;

const path = require("path");
const url = require("url");
const os = require("os");
const spawn = require("child_process").spawn;

const configureStore = require("./configureStore.js").configureStore;
const { X11_EVENT_TYPE, X11_KEY_MODIFIER } = require("../shared/X.js");
const actions = require("../shared/actions.js");

let backBrowsers = [];
let backBrowserHandles = {};

let frames = {};
let frameFromWin = {};

let store = configureStore();

const WIN_MINWIDTH = 140;
const WIN_MINHEIGHT = 140;

function isBrowserWin(win) {
  return backBrowserHandles.hasOwnProperty(win);
}

function isFrameWin(win) {
  return !!frames[win];
}

function createBackBrowser(props) {
  let win = new BrowserWindow({
    frame: false,
    fullscreen: true,
    width: props.width,
    height: props.height,
    webPreferences: {
      preload: `${__dirname}/../renderer-shared/preload.js`,
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  win.loadURL(url.format({
    pathname: path.join(__dirname, "../renderer-desktop/index.html"),
    protocol: "file:",
    slashes: true
  }));

  // Open the DevTools.
  win.webContents.openDevTools()

  let index = backBrowsers.length;
  backBrowsers[index] = win;

  let handle = getNativeWindowHandleInt(win);
  if (!handle) {
    console.error("Browser handle was null");
  }
  backBrowserHandles[handle] = index;

  console.log("Created browser window", handle);

  win.on("closed", function() {
    backBrowsers[index] = null;
  });

  // This works lol
  // setTimeout(() => {
  //   let mm = {
  //     x: 5,
  //     y: 5,
  //     type: "mouseMove",
  //     modifiers: [],
  //   };
  //   win.webContents.sendInputEvent(mm);
  // }, 10000);

  // https://github.com/electron/electron/blob/master/docs/api/web-contents.md#contentscapturepagerect-callback
  return handle;
}

function getNativeWindowHandleInt(win) {
    const hbuf = win.getNativeWindowHandle();
    return os.endianness() === "LE" ? hbuf.readInt32LE() : hbuf.readInt32BE();
}

module.exports = function startX() {
  var x11 = require("x11");
  var EventEmitter = require("events").EventEmitter;

  var X, root, white;
  var dragStart = null;

  let initializingWins = {};

  const registeredKeys = {
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

  x11.createClient(function(err, display) {
    if (err) {
      console.error(err);
      process.exit(1);
    }
    X = display.client;

    display.screen.forEach((screen, index) => {
      const props = {
        width: screen.pixel_width,
        height: screen.pixel_height
      };
      store.dispatch(actions.addScreen(props));

      const browserHandle = createBackBrowser(props);

      // setTimeout(() => {
      //   X.ChangeWindowAttributes(browserHandle, { eventMask: x11.eventMask.ButtonPress });
      //   const ee = new EventEmitter();
      //     X.event_consumers[browserHandle] = ee;
      //     ee.on("event", function(ev) {
      //         console.log("event", ev);
      //         if (ev.type === 4) {
      //           if (isBrowserWin(ev.wid))
      //             return;
      //           X.RaiseWindow(ev.wid);
      //            // dragStart = { rootx: ev.rootx, rooty: ev.rooty, x: ev.x, y: ev.y, winX: winX, winY: winY };
      //         } /*else if (ev.type == 5) {
      //             dragStart = null;
      //         } else if (ev.type == 6) {
      //             winX = dragStart.winX + ev.rootx - dragStart.rootx;
      //             winY = dragStart.winY + ev.rooty - dragStart.rooty;
      //             X.MoveWindow(fid, winX, winY);
      //         } else if (ev.type == 12) {
      //             //X.Render.Composite(3, bggrad, 0, framepic, 0, 0, 0, 0, 0, 0, width, height);
      //         }*/
      //     });

      // }, 0);

      root = screen.root;
      console.log("Root wid", root);
      white = screen.white_pixel;
      const rootEvents =
        //x11.eventMask.Button1Motion
        x11.eventMask.ButtonPress // | 4
        |x11.eventMask.KeyPress
        |x11.eventMask.FocusChange
        | x11.eventMask.PointerMotion
        | x11.eventMask.SubstructureNotify
        |x11.eventMask.SubstructureRedirect //|x11.eventMask.PointerMotion|x11.eventMask.KeyPress
        | x11.eventMask.Exposure;
      X.ChangeWindowAttributes(root, { eventMask: rootEvents }, function(err) {
        if (err.error == 10) {
          console.error('Error: Another window manager already running.');
          process.exit(1);
        }
        console.error('Error: Error in root event masking');
      });

      X.QueryTree(root, function(err, tree) {
        tree.children.forEach(ManageWindow);
      });

      for (let modifier in registeredKeys) {
        if (!registeredKeys.hasOwnProperty(modifier))
          continue;

        for (let key in registeredKeys[modifier]) {
          if (!registeredKeys[modifier].hasOwnProperty(key))
            continue;

          // function GrabKey(wid, ownerEvents, modifiers, key, pointerMode, keybMode) {
          X.GrabKey(root, true, parseInt(modifier), parseInt(key), 1 /* Async */, 1 /* Async */);
        }
      }

      // function GrabButton(wid, ownerEvents, mask, pointerMode, keybMode, confineTo, cursor, button, modifiers)
      // X.GrabButton(root, true, x11.eventMask.ButtonPress | x11.eventMask.ButtonRelease | x11.eventMask.PointerMotion, 1 /* Async */, 1 /* Async */, 0, 0, 0, 1 << 3 /* Mod1 */);
      // X.GrabButton( display.screen[0].root, true, x11.eventMask.ButtonPress | x11.eventMask.ButtonRelease | x11.eventMask.PointerMotion,
      //                1 /* Async */, 1 /* Async */, 0 /* None */, 0 /* None */, 1 << 3 /* Mod1 */, 1 );

      //launchProcess("xterm");
    });

  }).on("error", function(err) {
    console.error(err);
  }).on("event", function(ev) {
    if (ev.type === X11_EVENT_TYPE.KeyPress) onKeyPress(ev);
    else if (ev.type === X11_EVENT_TYPE.KeyRelease) { /* ignore */ }
    else if (ev.type === X11_EVENT_TYPE.ButtonPress) onButtonPress(ev);
    else if (ev.type === X11_EVENT_TYPE.MotionNotify) { /* ignore */ }
    else if (ev.type === X11_EVENT_TYPE.EnterNotify) onEnterNotify(ev);
    else if (ev.type === X11_EVENT_TYPE.LeaveNotify) onLeaveNotify(ev);
    else if (ev.type === X11_EVENT_TYPE.FocusIn) { /* ignore */ }
    else if (ev.type === X11_EVENT_TYPE.FocusOut) { /* ignore */ }
    else if (ev.type === X11_EVENT_TYPE.Expose) { /* ignore */ }
    else if (ev.type === X11_EVENT_TYPE.CreateNotify) { /* ignore */ }
    else if (ev.type === X11_EVENT_TYPE.DestroyNotify) onDestroyNotify(ev);
    else if (ev.type === X11_EVENT_TYPE.UnmapNotify) onUnmapNotify(ev);
    else if (ev.type === X11_EVENT_TYPE.MapNotify) { /* ignore */ }
    else if (ev.type === X11_EVENT_TYPE.MapRequest) onMapRequest(ev);
    else if (ev.type === X11_EVENT_TYPE.ReparentNotify) { /* ignore */ }
    else if (ev.type === X11_EVENT_TYPE.ConfigureNotify) { /* ignore */ }
    else if (ev.type === X11_EVENT_TYPE.ConfigureRequest) onConfigureRequest(ev);
    else if (ev.type === X11_EVENT_TYPE.ClientMessage) onClientMessage(ev);
    else {
      console.log("Unhandled event", ev.name, ev.type);
      if (ev.name === undefined) console.log(ev);
      // console.log(ev);
    }
  });

  function ManageWindow(wid) {
    console.log("MANAGE WINDOW: " + wid);

    const events = x11.eventMask.Button1Motion
      |x11.eventMask.ButtonPress
      |x11.eventMask.ButtonRelease
      |x11.eventMask.PointerMotion
      |x11.eventMask.EnterWindow
      |x11.eventMask.LeaveWindow
      |x11.eventMask.SubstructureNotify
      |x11.eventMask.SubstructureRedirect
      |x11.eventMask.Exposure;

    let fid = X.AllocID();
    frames[fid] = wid;
    frameFromWin[wid] = fid;

    // Make sure we don't respond to too many messages at once.
    initializingWins[wid] = true;
    initializingWins[fid] = true;

    X.GetWindowAttributes(wid, function(err, attrs) {
      if (err) {
        console.error("Couldn't GetWindowAttributes", wid, err);
        X.MapWindow(wid);
        return;
      }

      // override-redirect flag
      if (attrs[8]) {
        console.log("don't manage");
        X.MapWindow(wid);
        return;
      }

      X.GetGeometry(wid, function(err, clientGeom) {
        if (err) {
          console.error("Couldn't read geometry", err);
          return;
        }

        //console.log("Window geometry ", wid, clientGeom);
        var width = Math.max(clientGeom.width, WIN_MINWIDTH);
        var height = Math.max(clientGeom.height, WIN_MINHEIGHT);

        const browserWin = isBrowserWin(wid);

        let winX = browserWin ? 0 : 10;
        let winY = browserWin ? 0 : 50;

        //console.log(frameFromWin);
        X.CreateWindow(fid, root, winX, winY, width, height, 0, 0, 0, 0, {
          backgroundPixel: white,
          eventMask: events
        });

        X.ChangeSaveSet(1, wid);
        X.ReparentWindow(wid, fid, 0, 0);

        //  X.ChangeWindowAttributes(wid, { eventMask: events }, function(err) {
        //    console.error("Error in child event masking");
        //  });

        if (!browserWin) {
          store.dispatch(actions.addWindow({
            wid,
            x: winX,
            y: winY,
            width,
            height,
            visible: true,
            decorated: true,
          }));

          determineWindowTitle(wid);
          determineWindowDecorated(wid);
          determineWindowHidden(wid);

          //console.log("ConfigureWindow", wid.toString(16));
          X.ConfigureWindow(wid, {
            x: 0,
            y: 0,
            width: width,
            height: height,
            //borderWidth: 0
          });
        }

    const ee = new EventEmitter();
    X.event_consumers[wid] = ee;
    ee.on("event", function(ev) {
      //console.log("event", ev);
      if (ev.type === X11_EVENT_TYPE.DestroyNotify) {
        X.DestroyWindow(fid);
        delete frames[fid];
        delete frameFromWin[wid];
      }
      // if (ev.type === 4) {
      //   if (isBrowserWin(ev.wid))
      //     return;
      //   X.RaiseWindow(ev.wid);
      //    // dragStart = { rootx: ev.rootx, rooty: ev.rooty, x: ev.x, y: ev.y, winX: winX, winY: winY };
      /* } else if (ev.type == 5) {
          dragStart = null;
      } else if (ev.type == 6) {
          winX = dragStart.winX + ev.rootx - dragStart.rootx;
          winY = dragStart.winY + ev.rooty - dragStart.rooty;
          X.MoveWindow(fid, winX, winY);
      } else if (ev.type == 12) {
          //X.Render.Composite(3, bggrad, 0, framepic, 0, 0, 0, 0, 0, 0, width, height);
      }*/
    });
    //setTimeout(() => {
      // X.ChangeWindowAttributes(wid, { eventMask: events }, function(err) {
      //   console.error("Error in child event masking", err);
      // });
    //}, 750);

        console.log("Initial map of fid and wid", fid, wid);
        X.MapWindow(fid);
        X.MapWindow(wid);

        delete initializingWins[wid];
        delete initializingWins[fid];
      });
    });
  }

  function onDestroyNotify(ev) {
    if (!isFrameWin(ev.wid)) {
      store.dispatch(actions.removeWindow(ev.wid));
    }
  }

  function onMapRequest(ev) {
    const wid = ev.wid;
    console.log("onMapRequest", wid);
    if (initializingWins[wid])
      return;

    showWindow(wid);
  }

  function showWindow(wid) {
    const isFrame = isFrameWin(wid);
    if (!isFrame) {
      if (!frameFromWin[wid]) {
        ManageWindow(wid);
        return;
      }

      X.MapWindow(frameFromWin[wid]);

      if (!isBrowserWin(wid)) {
        // if (isFrame) {
        //   X.MapWindow(ev.wid);
        //   X.MapWindow(frames[ev.wid]);
        // }
        // else {
        //   X.MapWindow(frameFromWin[ev.wid]);
        //   X.MapWindow(ev.wid);
        // }
        
        store.dispatch(actions.setWindowVisible(wid, true));
      }
    }

    X.MapWindow(wid);
  }

  function onUnmapNotify(ev) {
    const wid = ev.wid;
    console.log("onUnmapNotify", wid);
    if (!isFrameWin(wid) && !isBrowserWin(wid)) {
      store.dispatch(actions.setWindowVisible(wid, false));
    }
  }

  function onConfigureRequest(ev) {
    // console.log("onConfigureRequest", ev.wid);
    if (isBrowserWin(ev.wid)
      || initializingWins[ev.wid]
      || !store.getState().windows[ev.wid]) {
      return;
    }

    const config = {
      x: ev.x,
      y: ev.y,
      width: ev.width,
      height: ev.height,
      //borderWidth: 0, // No borders
      //sibling: ev.sibling,
      //stackMode: ev.stackMode
    };
    const innerConfig = Object.assign({}, config, { x: 0, y: 0 });

    const isFrame = isFrameWin(ev.wid);
    if (isFrame) {
      // X.ConfigureWindow(frames[ev.wid], config);
    }
    else {
      X.ConfigureWindow(frameFromWin[ev.wid], config);
      X.ConfigureWindow(ev.wid, innerConfig);
    }

    store.dispatch(actions.configureWindow(ev.wid, config));
  }

  function onEnterNotify(ev) {
    isFrame = isFrameWin(ev.wid);
    let window = isFrame ? frames[ev.wid] : ev.wid;

    changeFocus(window);
  }

  function changeFocus(window) {
    X.SetInputFocus(window, 0);

    if (!isBrowserWin(window) && window !== root) {
      unsetFocus();
      store.dispatch(actions.focusWindow(window));
    }
  }

  function unsetFocus() {
    let focusedWindow = getFocusedWindow();
    if (focusedWindow) {
      store.dispatch(actions.unfocusWindow(focusedWindow));
    }
  }

  function onLeaveNotify(ev) {
    // console.log("onLeaveNotify", ev.wid);
    // if (!isBrowserWin(ev.wid)) {
    //   const isFrame = !!frames[ev.wid];
    //   let window = isFrame ? frames[ev.wid] : ev.wid;
    //   store.dispatch(actions.unfocusWindow(window));
    // }
  }

  function onKeyPress(ev) {
    console.log("onKeyPress", ev);

    const kb = registeredKeys;
    if (kb[ev.buttons] && kb[ev.buttons][ev.keycode]) {
      const browser = backBrowsers[0];
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
          electron.app.quit();
        }
        break;
      case (X11_KEY_MODIFIER.Mod4Mask | X11_KEY_MODIFIER.ControlMask):
        // Win + Ctrl + R
        if (ev.keycode === 27) {
          electron.app.relaunch();
          electron.app.exit(0);
        }
        break;
    }
  }

  function onButtonPress(ev) {
    console.log("onButtonPress", ev);
    if (isBrowserWin(ev.wid))
      return;
    // X.RaiseWindow(ev.wid);
  }

  function onClientMessage(ev) {
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

  function launchProcess(name) {
    const child = spawn(name, [], {
      detached: true,
      stdio: "ignore"
    });
    child.unref(); // Allow electron to close before this child
  }

  function determineWindowTitle(wid) {
    X.GetProperty(0, wid, X.atoms.WM_NAME, X.atoms.STRING, 0, 10000000, function(err, prop) {
      if (prop.type == X.atoms.STRING) {
        prop.data = prop.data.toString();
        if (prop.data)
          store.dispatch(actions.setWindowTitle(wid, prop.data));
      }
    });
  }

  function determineWindowDecorated(wid) {
    X.InternAtom(true, "_MOTIF_WM_HINTS", function(err, atom) {
      X.GetProperty(0, wid, atom, 0, 0, 10000000, function(err, prop) {
        if (err) {
          console.error("GetProperty _MOTIF_WM_HINTS error", err);
          return;
        }

        let buffer = prop.data;
        if (buffer && buffer.length) {
          if (buffer[0] === 0x02) { // Specifying decorations
            if (buffer[2] === 0x00) { // No decorations
              store.dispatch(actions.setWindowDecorated(wid, false));
            }
          }
        }
      });
    });
  }

  function determineWindowHidden(wid) {
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
  }

  function getFocusedWindow() {
    let windows = store.getState().windows;
    for (let wid in windows) {
      if (windows[wid].focused)
        return wid;
    }
    return null;
  }

  function XGetWMProtocols(wid, callback) {
    X.InternAtom(true, "WM_PROTOCOLS", function(err, atom) {
      if (err) {
        callback(err);
        return;
      }

      X.GetProperty(0, wid, atom, 0, 0, 10000000, function(err, prop) {
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

  function closeWindow(wid) {
    supportsGracefulDestroy(wid, function(err, args) {
      if (err) {
        console.log("Error in supportsGracefulDestroy", err);
      }
      if (args.supported) {
        const eventData = new Buffer(32);
        eventData.writeUInt8(33, 0); // Event Type 33 = ClientMessage
        eventData.writeUInt8(32, 1); // Format
        eventData.writeUInt32LE(wid, 4); // Window ID
        eventData.writeUInt32LE(args.atom, 8); // Message Type
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

  function supportsGracefulDestroy(wid, callback) {
    XGetWMProtocols(wid, function(err, protocols) {
      if (err) {
        console.error("XGetWMProtocols error", err);
        callback(err);
        return;
      }

      X.InternAtom(true, "WM_DELETE_WINDOW", function(err, atom) {
        if (err) {
          callback(err);
          return;
        }

        callback(null, {
          atom: atom,
          supported: protocols.indexOf(atom) >= 0
        });
      });
    });
  }

  function raiseWindow(wid) {
    let windows = store.getState().windows;
    let window = windows[wid];

    if (!window.visible) {
      showWindow(wid);
    }
    else {
      let fid = frameFromWin[wid];
      if (fid)
        X.RaiseWindow(fid);
      if (wid)
        X.RaiseWindow(wid);
    }
  }

  function minimize(wid) {
    let fid = frameFromWin[wid];
    if (fid)
      X.UnmapWindow(fid);
    if (wid)
      X.UnmapWindow(wid);

    unsetFocus();
  }

  const { ipcMain } = require("electron");
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
}
