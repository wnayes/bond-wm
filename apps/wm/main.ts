import { app, dialog } from "electron";
import { startWindowManager } from "./wm";
import { loggingEnabled } from "./args";
import { log } from "./log";
import { electronIpcLog } from "./electronLog";

// Disable error dialogs by override
dialog.showErrorBox = function (title, content) {
  console.error(`${title}\n${content}`);
};

log("electron-wm main");
log("user data path: ", app.getPath("userData"));

if (loggingEnabled()) {
  electronIpcLog(log);
}

// Possibly could help with transparency?
// app.commandLine.appendSwitch("enable-transparent-visuals");
// app.commandLine.appendSwitch("disable-gpu");
// app.disableHardwareAcceleration();

// Quit when all windows are closed.
app.on("window-all-closed", () => {
  app.quit();
});

app.on("ready", async () => {
  startWindowManager();
});
