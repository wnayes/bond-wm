import { app, dialog } from "electron";
import { startX } from "./wm";
import "./args";
import { log } from "./log";

// Disable error dialogs by override
dialog.showErrorBox = function (title, content) {
  console.error(`${title}\n${content}`);
};

/* eslint-disable */
try {
  // With this ignore pattern, we're effectively just listening to CSS in the browser windows.
  // It isn't too safe to reload code modules right now, at least not in the WM you're using currently!
  require("electron-reloader")(module, {
    ignore: ["**/*.tsx", "**/*.ts", "**/*.js", "**/*.md", "**/*.json"],
  });
} catch (e) {
  console.error("electron-reloader error", e);
}
/* eslint-enable */

log("electron-wm main");
log("user data path: ", app.getPath("userData"));

// Quit when all windows are closed.
app.on("window-all-closed", () => {
  app.quit();
});

app.on("ready", () => {
  startX();
});
