const { ipcRenderer } = require("electron");

const { X11_KEY_MODIFIER } = require("./X.js");

module.exports = function setupIpc(store) {
  window.commands = {
    raiseWindow: function(wid) {
      ipcRenderer.send("raise-window", wid);
    },

    minimizeWindow: function(wid) {
      ipcRenderer.send("minimize-window", wid);
    },

    closeWindow: function(wid) {
      ipcRenderer.send("close-window", wid);
    },

    exec: function(executable, args) {
      ipcRenderer.send("exec", {
        executable,
        args
      });
    },
  };

  const actions = require("./actions.js");

  ipcRenderer.on("x-keypress", (event, args) => {
    console.log(args);
    if (args.buttons === X11_KEY_MODIFIER.Mod4Mask) {
      if (args.keycode === 27) {
        store.dispatch(actions.toggleTaskbarRunField(true));
      }
    }
  });
}
