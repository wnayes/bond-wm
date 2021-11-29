const electron = require("electron");

// Disable error dialogs by override
const dialog = electron.dialog;
dialog.showErrorBox = function(title, content) {
  console.error(`${title}\n${content}`);
};

try {
	require("electron-reloader")(module);
}
catch {}

const app = electron.app;

// Quit when all windows are closed.
app.on("window-all-closed", function() {
  app.quit();
});

app.on("activate", function() {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  // if (mainWindow === null) {
  //   createWindow();
  // }
});

const startX = require("./wm.js");

app.on("ready", function() {
  console.log("test");
  startX();
});

