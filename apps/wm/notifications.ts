import { app, BrowserWindow, ipcMain } from "electron";
import * as dbus from "dbus-next";
import { interface as dbusInterface, RequestNameReply, Variant } from "dbus-next";
import { EventEmitter } from "events";

export interface Notification {
  id: number;
  appName: string;
  summary: string;
  body: string;
  appIcon?: string;
  expireTimeout: number;
  actions?: NotificationAction[];
  timestamp: number;
}

export interface NotificationAction {
  id: string;
  label: string;
}

export interface DBusHints {
  [key: string]: Variant;
}

// IPC messages for notifications
export const NotificationIPCMessages = {
  NewNotification: "notification:new",
  CloseNotification: "notification:close",
  ClearAllNotifications: "notification:clear-all",
  NotificationAction: "notification:action",
  NotificationClosed: "notification:user-closed",
  RequestNotifications: "notification:request-all",
} as const;

export class NotificationServer {
  private bus = dbus.sessionBus();
  private notificationCounter = 1;
  private activeNotifications = new Map<number, Notification>();
  private notificationInterface: NotificationInterface;
  private broadcastCallback: (channel: string, ...args: any[]) => void;

  constructor(broadcastCallback: (channel: string, ...args: any[]) => void) {
    this.broadcastCallback = broadcastCallback;

    this.notificationInterface = new NotificationInterface(
      this.handleNotification.bind(this),
      this.parseActions.bind(this),
      this.bus // Pass bus to interface
    );

    this.setupIPCHandlers();
  }

  private setupIPCHandlers(): void {
    // Handler for requesting all notifications
    ipcMain.on(NotificationIPCMessages.RequestNotifications, (event) => {
      const notifications = Array.from(this.activeNotifications.values());
      notifications.forEach((notification) => {
        event.reply(NotificationIPCMessages.NewNotification, notification);
      });
    });

    // Handler for when user closes a notification
    ipcMain.on(NotificationIPCMessages.NotificationClosed, (event, id: number) => {
      if (this.activeNotifications.has(id)) {
        this.activeNotifications.delete(id);
        this.emitNotificationClosed(id, 2); // 2 = dismissed by user
        this.broadcastToAllDesktops(NotificationIPCMessages.CloseNotification, id);
      }
    });

    ipcMain.on(
      NotificationIPCMessages.NotificationAction,
      (event, data: { notificationId: number; actionId: string }) => {
        const notification = this.activeNotifications.get(data.notificationId);
        if (notification) {
          try {
            this.emitActionInvoked(data.notificationId, data.actionId);

            this.activeNotifications.delete(data.notificationId);
            this.broadcastToAllDesktops(NotificationIPCMessages.CloseNotification, data.notificationId);
          } catch (error) {
            console.error(`Error processing action:`, error);
          }
        } else {
          console.warn(`Notification ${data.notificationId} not found for action ${data.actionId}`);
        }
      }
    );

    // Handler for clearing all notifications
    ipcMain.on(NotificationIPCMessages.ClearAllNotifications, (event) => {
      this.activeNotifications.clear();
      this.broadcastToAllDesktops(NotificationIPCMessages.ClearAllNotifications);
    });
  }

  private broadcastToAllDesktops(channel: string, ...args: any[]): void {
    if (this.broadcastCallback) {
      this.broadcastCallback(channel, ...args);
    }
  }

  private emitActionInvoked(notificationId: number, actionId: string): void {
    try {
      if (!this.notificationInterface) {
        throw new Error("Notification interface is not initialized");
      }

      this.notificationInterface.emitActionInvoked(notificationId, actionId);

      try {
        const { execSync } = require("child_process");
        const cmd = `dbus-send --session --type=signal /org/freedesktop/Notifications org.freedesktop.Notifications.ActionInvoked uint32:${notificationId} string:"${actionId}"`;
        execSync(cmd);
      } catch (err) {
        console.error(`Error sending signal via dbus-send:`, err);
      }
    } catch (error) {
      console.error("Error emitting ActionInvoked signal:", error);
    }
  }

  private emitNotificationClosed(notificationId: number, reason: number = 3): void {
    try {
      if (!this.notificationInterface) {
        throw new Error("Notification interface is not initialized");
      }

      this.notificationInterface.emitNotificationClosed(notificationId, reason);
    } catch (error) {
      console.warn("Error emitting NotificationClosed signal:", error);
    }
  }

  public async start(): Promise<void> {
    try {
      console.log("🚀 Starting notification server...");

      const dbusObj = await this.bus.getProxyObject("org.freedesktop.DBus", "/org/freedesktop/DBus");
      const dbusInterface = dbusObj.getInterface("org.freedesktop.DBus");
      const names = await dbusInterface.ListNames();

      if (names.includes("org.freedesktop.Notifications")) {
        console.log("⚠️ Notification service already running");
        return;
      }

      this.bus.export("/org/freedesktop/Notifications", this.notificationInterface);

      const result = await this.bus.requestName("org.freedesktop.Notifications", 0x4);

      if (result === RequestNameReply.PRIMARY_OWNER) {
        console.log("Notification service registered successfully");

        // Test signal emission to verify functionality
        setTimeout(() => {
          console.log(" Testing D-Bus signal emission...");
          try {
            this.emitActionInvoked(999, "test-action");
            this.emitNotificationClosed(999, 1);
          } catch (error) {
            console.error("Error in signal test:", error);
          }
        }, 2000);
      } else {
        console.warn("Could not register service. Code:", result);
      }
    } catch (error) {
      console.error("Error starting DBus server:", error);
    }
  }

  private handleNotification(notification: Notification): void {
    this.activeNotifications.set(notification.id, notification);

    this.broadcastToAllDesktops(NotificationIPCMessages.NewNotification, notification);
  }

  private parseActions(actions: string[]): NotificationAction[] {
    const parsedActions: NotificationAction[] = [];

    // Actions come in pairs: [id, label, id, label, ...]
    for (let i = 0; i < actions.length; i += 2) {
      if (actions[i + 1]) {
        parsedActions.push({
          id: actions[i],
          label: actions[i + 1],
        });
      }
    }

    return parsedActions;
  }
}

class NotificationInterface extends dbusInterface.Interface {
  private notificationCounter = 1;
  public emitter: EventEmitter;
  private bus: any; // Store the bus instance for signal emission

  constructor(
    private notifyCallback: (notification: Notification) => void,
    private parseActions: (actions: string[]) => NotificationAction[],
    bus: any
  ) {
    super("org.freedesktop.Notifications");
    this.bus = bus;
    this.emitter = new EventEmitter();
  }

  // Methods to emit signals directly
  emitActionInvoked(notificationId: number, actionId: string): void {
    //  Send signal message directly via bus
    const { Message } = require("dbus-next");
    const signalMessage = new Message({
      type: dbus.MessageType.SIGNAL,
      path: "/org/freedesktop/Notifications",
      interface: "org.freedesktop.Notifications",
      member: "ActionInvoked",
      signature: "us",
      body: [notificationId, actionId],
    });

    if (this.bus && this.bus.send) {
      this.bus.send(signalMessage);
    } else {
      throw new Error("Bus not available in interface instance");
    }

    this.emitter.emit("ActionInvoked", notificationId, actionId);
  }

  emitNotificationClosed(notificationId: number, reason: number): void {
    // Send signal message directly via bus
    const { Message } = require("dbus-next");
    const signalMessage = new Message({
      type: dbus.MessageType.SIGNAL,
      path: "/org/freedesktop/Notifications",
      interface: "org.freedesktop.Notifications",
      member: "NotificationClosed",
      signature: "uu",
      body: [notificationId, reason],
    });

    if (this.bus && this.bus.send) {
      this.bus.send(signalMessage);
    } else {
      throw new Error("Bus not available in interface instance");
    }

    this.emitter.emit("NotificationClosed", notificationId, reason);
  }

  Notify(
    appName: string,
    replacesId: number,
    appIcon: string,
    summary: string,
    body: string,
    actions: string[],
    hints: DBusHints,
    expireTimeout: number
  ): number {
    const id = replacesId > 0 ? replacesId : this.notificationCounter++;

    const notification: Notification = {
      id,
      appName: String(appName),
      summary: String(summary),
      body: String(body),
      appIcon: appIcon ? String(appIcon) : undefined,
      expireTimeout,
      actions: this.parseActions(actions),
      timestamp: Date.now(),
    };

    this.notifyCallback(notification);
    return id;
  }

  CloseNotification(id: number): void {
    console.log(`D-Bus call to CloseNotification for ID: ${id}`);
    // Note: Actual closing will be handled via IPC or timeout
    // The client application already knows the notification was closed
  }

  GetCapabilities(): string[] {
    return ["body", "actions", "persistence", "action-icons", "body-markup", "body-hyperlinks"];
  }

  GetServerInformation(): [string, string, string, string] {
    return ["Bond WM Notifications", "Bond WM", app.getVersion(), "1.2"];
  }
}

(NotificationInterface as any).configureMembers({
  methods: {
    Notify: {
      inSignature: "susssasa{sv}i",
      outSignature: "u",
    },
    CloseNotification: {
      inSignature: "u",
      outSignature: "",
    },
    GetCapabilities: {
      inSignature: "",
      outSignature: "as",
    },
    GetServerInformation: {
      inSignature: "",
      outSignature: "ssss",
    },
  },
  signals: {
    ActionInvoked: {
      signature: "us",
    },
    NotificationClosed: {
      signature: "uu",
    },
  },
});
