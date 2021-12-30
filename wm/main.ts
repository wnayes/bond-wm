import { app, dialog } from "electron";
import { startX, XServer } from "./wm";

let server: XServer;

// Disable error dialogs by override
dialog.showErrorBox = function(title, content) {
  console.error(`${title}\n${content}`);
};

// try {
// 	require("electron-reloader")(module);
// }
// catch {}

// Quit when all windows are closed.
app.on("window-all-closed", function() {
  app.quit();
});

app.on("ready", function() {
  server = startX();
});
