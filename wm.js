// This file is pretty messy, it is just a prototype for now!

const electron = require("electron");
const BrowserWindow = electron.BrowserWindow;

const path = require("path");
const url = require("url");
const os = require("os");

let backBrowsers = [];
let backBrowserHandles = {};

let frames = {};
let frameFromWin = {};

const configureStore = require("./configureStore.js").configureStore;
let store = configureStore("main", {
  screens: [],
  windows: {}
});

const actions = require("./actions.js");

const WIN_MINWIDTH = 140;
const WIN_MINHEIGHT = 140;

const X11_EVENT_TYPE = {
  KeyPress: 2,
  KeyRelease: 3,
  ButtonPress: 4,
  ButtonRelease: 5,
  MotionNotify: 6,
  EnterNotify: 7,
  LeaveNotify: 8,
  FocusIn: 9,
  FocusOut: 10,
  KeymapNotify: 11,
  Expose: 12,
  GraphicsExpose: 13,
  NoExpose: 14,
  VisibilityNotify: 15,
  CreateNotify: 16,
  DestroyNotify: 17,
  UnmapNotify: 18,
  MapNotify: 19,
  MapRequest: 20,
  ReparentNotify: 21,
  ConfigureNotify: 22,
  ConfigureRequest: 23,
  GravityNotify: 24,
  ResizeRequest: 25,
  CirculateNotify: 26,
  CirculateRequest: 27,
  PropertyNotify: 28,
  SelectionClear: 29,
  SelectionRequest: 30,
  SelectionNotify: 31,
  ColormapNotify: 32,
  ClientMessage: 33,
  MappingNotify: 34,
  GenericEvent: 35
};

// Event masks
//  KeyPress: 1,
//   KeyRelease: 2,
//   ButtonPress: 4,
//   ButtonRelease: 8,
//   EnterWindow: 16,
//   LeaveWindow: 32,
//   PointerMotion: 64,
//   PointerMotionHint: 128,
//   Button1Motion: 256,
//   Button2Motion: 512,
//   Button3Motion: 1024,
//   Button4Motion: 2048,
//   Button5Motion: 4096,
//   ButtonMotion: 8192,
//   KeymapState: 16384,
//   Exposure: 32768,
//   VisibilityChange: 65536,
//   StructureNotify: 131072,
//   ResizeRedirect: 262144,
//   SubstructureNotify: 524288,
//   SubstructureRedirect: 1048576,
//   FocusChange: 2097152,
//   PropertyChange: 4194304,
//   ColormapChange: 8388608,
//   OwnerGrabButton: 16777216

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
      preload: `${__dirname}/preload.js`,
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  win.loadURL(url.format({
    pathname: path.join(__dirname, "index.html"),
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
      console.log("white", white);
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

      var child = require("child_process").spawn;
      child("xterm");
      child("evince");
    });

  }).on("error", function(err) {
    console.error(err);
  }).on("event", function(ev) {
    if (ev.type === X11_EVENT_TYPE.ButtonPress) onButtonPress(ev);
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

        console.log("Window geometry ", wid, clientGeom);
        var width = Math.max(clientGeom.width, WIN_MINWIDTH);
        var height = Math.max(clientGeom.height, WIN_MINHEIGHT);

        const browserWin = isBrowserWin(wid);

        let winX = browserWin ? 0 : 10;
        let winY = browserWin ? 0 : 50;

        console.log(frameFromWin);
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

          // function(wid, ownerEvents, mask, pointerMode, keybMode, confineTo, cursor, button, modifiers)
          // X.GrabButton(wid, true, x11.eventMask.ButtonPress, 0, 0, 0, 0, 1, 1);
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

  function onButtonPress(ev) {
    if (isBrowserWin(ev.wid))
      return;
    X.RaiseWindow(ev.wid);
    console.log("onButtonPress RaiseWindow");
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

  ipcMain.on("close-window", (event, wid) => {
    closeWindow(wid);
  });
}