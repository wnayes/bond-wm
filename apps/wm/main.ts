import { app, dialog } from "electron";
import { startWindowManager } from "./wm";
import { loggingEnabled } from "./args";
import { log } from "./log";
import { electronIpcLog } from "./electronLog";
import { initializeNotificationsService, shutdownNotificationsService } from "./notifications";

// Disable error dialogs by override
dialog.showErrorBox = function (title, content) {
  console.error(`${title}\n${content}`);
};

log("bond-wm main");
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

app.on("before-quit", async () => {
  log("Shutting down services...");
  await shutdownNotificationsService();
});

app.on("ready", async () => {

  try {
    // Inicializa o serviço de notificações D-Bus
    log("Starting D-Bus notifications service...");
    await initializeNotificationsService();
    log("D-Bus notifications service started successfully");
  } catch (error) {
    log("Warning: Failed to start D-Bus notifications service:", error);
    // Continua a execução mesmo se o serviço de notificações falhar
    // Ainda assim, tentamos configurar os handlers IPC básicos para que as notificações funcionem internamente
    try {
      const { setupIpcHandlers } = require("./notifications");
      setupIpcHandlers();
      log("IPC handlers for notifications configured despite D-Bus failure");
    } catch (setupError) {
      log("Failed to setup notification IPC handlers:", setupError);
    }
  }
  startWindowManager();
});
