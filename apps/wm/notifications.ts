import { spawn, ChildProcess } from "child_process";
import { BrowserWindow, ipcMain } from "electron";
import { log } from "./log";

export interface INotification {
  id: number;
  app_name: string;
  app_icon: string;
  summary: string;
  body: string;
  actions: string[];
  hints: Record<string, any>;
  expire_timeout: number;
  timestamp: number;
}

// Global variables
const notificationsMap = new Map<number, INotification>();
let pythonProcess: ChildProcess | null = null;

/**
 * Processes a new notification received from the Python process
 */
function handleNotificationFromPython(notification: INotification): void {
  log("Notification received from Python:", {
    id: notification.id,
    app_name: notification.app_name,
    summary: notification.summary,
    body: notification.body,
  });

  // Store the notification
  notificationsMap.set(notification.id, notification);

  // Send to all renderer windows via IPC
  const windows = BrowserWindow.getAllWindows();
  windows.forEach((win) => {
    win.webContents.send("notification:new", notification);
  });

  log(`Notification ${notification.id} sent to ${windows.length} windows`);
}

/**
 * Closes a notification
 */
function handleCloseNotification(id: number): void {
  log(`Closing notification ${id}`);

  notificationsMap.delete(id);

  // Send close event to renderer
  const windows = BrowserWindow.getAllWindows();
  windows.forEach((win) => {
    win.webContents.send("notification:close", id);
  });

  // Send command to Python process
  if (pythonProcess && pythonProcess.stdin) {
    try {
      const command = JSON.stringify({
        type: "close_notification",
        id: id,
      });
      pythonProcess.stdin.write(command + "\n");
    } catch (error) {
      log("Failed to send close command to Python process:", error);
    }
  }
}

/**
 * Processes action invoked by user
 */
function handleActionInvoked(id: number, action: string): void {
  log(`[ACTION] Processing action: ${action} for notification ${id}`);

  // Send command to Python process
  if (pythonProcess && pythonProcess.stdin) {
    try {
      const command = JSON.stringify({
        type: "action_invoked",
        id: id,
        action: action,
      });
      log(`[ACTION] Sending command to Python: ${command}`);
      pythonProcess.stdin.write(command + "\n");
      log(`[ACTION] Command sent successfully to Python process`);
    } catch (error) {
      log(`[ACTION] Failed to send action command to Python process:`, error);
    }
  } else {
    log(`[ACTION] ERROR - Python process is not available or stdin is not accessible`);
    log(`[ACTION] pythonProcess exists: ${pythonProcess !== null}`);
    log(`[ACTION] pythonProcess.stdin exists: ${pythonProcess?.stdin !== undefined}`);
  }
}

/**
 * Gets all active notifications
 */
function getActiveNotifications(): INotification[] {
  return Array.from(notificationsMap.values());
}

/**
 * Removes expired notifications
 */
function removeExpiredNotifications(): void {
  const now = Date.now();
  for (const [id, notification] of notificationsMap) {
    if (notification.expire_timeout > 0) {
      const expired = now - notification.timestamp > notification.expire_timeout;
      if (expired) {
        handleCloseNotification(id);
      }
    }
  }
}

/**
 * Initializes the notifications service using Python process
 */
export async function initializeNotificationsService(): Promise<void> {
  try {
    log("Initializing Python-based notifications service...");

    // Setup IPC handlers for communication with renderer FIRST
    setupIpcHandlers();
    log("IPC handlers for notifications have been registered");

    const pythonScript = "/usr/local/bin/notification_server.py";

    log("Python script path:", pythonScript);

    // Check if file exists before trying to execute
    const fs = require("fs");
    if (!fs.existsSync(pythonScript)) {
      throw new Error(`Python notification server script not found at: ${pythonScript}`);
    }

    log("Python script found, proceeding to spawn process...");

    // Start Python process
    pythonProcess = spawn("python3", [pythonScript], {
      stdio: ["pipe", "pipe", "pipe"],
    });

    if (!pythonProcess) {
      throw new Error("Failed to spawn Python notification server process");
    }

    // Configure Python process handlers
    pythonProcess.stdout?.on("data", (data) => {
      const output = data.toString();
      const lines = output.split("\n");

      for (const line of lines) {
        if (line.trim()) {
          // Look for notification server messages
          if (line.startsWith("BONDWM_NOTIFICATION:")) {
            const jsonStr = line.replace("BONDWM_NOTIFICATION:", "");
            try {
              const message = JSON.parse(jsonStr);
              handlePythonMessage(message);
            } catch (e) {
              log("Error parsing Python message JSON:", e);
            }
          } else {
            // Log other Python outputs for debug
            log("Python output:", line);
          }
        }
      }
    });

    // Capture Python errors
    pythonProcess.stderr?.on("data", (data) => {
      log("Python stderr:", data.toString());
    });

    // When Python process terminates
    pythonProcess.on("close", (code) => {
      log(`Python notification server process exited with code ${code}`);
      pythonProcess = null;
    });

    pythonProcess.on("error", (error) => {
      log("Python process error:", error);
      pythonProcess = null;
    });

    // Cleanup expired notifications every 30 seconds
    setInterval(() => {
      removeExpiredNotifications();
    }, 30000);

    log("Python-based notifications service initialized successfully");
  } catch (error) {
    log("Failed to initialize Python notifications service:", error);
    throw error;
  }
}

/**
 * Processes messages from Python process
 */
function handlePythonMessage(message: any): void {
  switch (message.type) {
    case "server_ready":
      log("Python notification server is ready:", message.message);
      break;

    case "notification_new":
      if (message.notification) {
        handleNotificationFromPython(message.notification);
      }
      break;

    case "notification_close":
      if (message.id) {
        // Only remove locally, don't send back to Python
        notificationsMap.delete(message.id);
        const windows = BrowserWindow.getAllWindows();
        windows.forEach((win) => {
          win.webContents.send("notification:close", message.id);
        });
      }
      break;

    case "action_invoked":
      log(`Action invoked in Python: ${message.action} for notification ${message.id}`);
      break;

    case "action_invoked_success":
      log(`Action successfully processed by Python: ${message.action} for notification ${message.id}`);
      break;

    case "error":
      log("Python server error:", message.message);
      break;

    default:
      log("Unknown message type from Python:", message);
  }
}

/**
 * Sets up IPC handlers for communication with renderer
 */
export function setupIpcHandlers(): void {
  log("Setting up IPC handlers for notifications");

  // Handler to close notification from renderer
  ipcMain.handle("notification:close", async (event, id: number) => {
    log(`IPC handler called: notification:close for ID ${id}`);
    handleCloseNotification(id);
  });

  // Handler to invoke notification action
  ipcMain.handle("notification:action", async (event, id: number, action: string) => {
    console.log(`[MAIN] IPC action invoked: ${action} for notification ${id}`);
    log(`IPC action invoked: ${action} for notification ${id}`);
    log(`Python process available: ${pythonProcess !== null}`);
    log(`Python process stdin available: ${pythonProcess?.stdin !== null}`);
    handleActionInvoked(id, action);
  });

  // Handler to get active notifications
  ipcMain.handle("notification:getActive", async () => {
    log("IPC handler called: notification:getActive");
    const notifications = getActiveNotifications();
    log(`Returning ${notifications.length} active notifications`);
    return notifications;
  });
}

/**
 * Retorna o serviço de notificações para uso por outros módulos
 */
export function getNotificationsService() {
  return {
    getActiveNotifications,
    removeExpiredNotifications,
  };
}

/**
 * Desliga o serviço de notificações Python
 */
export async function shutdownNotificationsService(): Promise<void> {
  if (pythonProcess) {
    try {
      log("Shutting down Python notification server...");
      pythonProcess.kill("SIGTERM");

      // Aguarda um pouco para o processo encerrar graciosamente
      await new Promise((resolve) => {
        if (pythonProcess) {
          pythonProcess.on("close", resolve);
          // Timeout de segurança
          setTimeout(resolve, 3000);
        } else {
          resolve(undefined);
        }
      });

      log("Python notification server shutdown complete");
    } catch (error) {
      log("Error shutting down Python notification server:", error);
    }
  }

  pythonProcess = null;
}
