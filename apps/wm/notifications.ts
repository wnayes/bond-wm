import { app, nativeImage, dialog, BrowserWindow, ipcMain } from 'electron';
import * as dbus from 'dbus-next';
import { Variant, RequestNameReply } from 'dbus-next';
import { interface as dbusInterface } from 'dbus-next';

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

// Mensagens IPC para notificações
export const NotificationIPCMessages = {
  NewNotification: 'notification:new',
  CloseNotification: 'notification:close',
  ClearAllNotifications: 'notification:clear-all',
  NotificationAction: 'notification:action',
  NotificationClosed: 'notification:user-closed',
  RequestNotifications: 'notification:request-all',
} as const;

export class NotificationServer {
  private bus = dbus.sessionBus();
  private notificationCounter = 1;
  private activeNotifications = new Map<number, Notification>();
  private notificationInterface: NotificationInterface;
  private desktopBrowsers: (BrowserWindow | null)[] = [];

  constructor(desktopBrowsers: (BrowserWindow | null)[]) {
    this.desktopBrowsers = desktopBrowsers;
    this.notificationInterface = new NotificationInterface(
      this.handleNotification.bind(this),
      this.parseActions.bind(this)
    );
    this.setupIPCHandlers();
  }

  private setupIPCHandlers(): void {
    // Handler para solicitar todas as notificações
    ipcMain.on(NotificationIPCMessages.RequestNotifications, (event) => {
      const notifications = Array.from(this.activeNotifications.values());
      notifications.forEach(notification => {
        event.reply(NotificationIPCMessages.NewNotification, notification);
      });
    });

    // Handler para quando o usuário fecha uma notificação
    ipcMain.on(NotificationIPCMessages.NotificationClosed, (event, id: number) => {
      this.activeNotifications.delete(id);
      this.broadcastToAllDesktops(NotificationIPCMessages.CloseNotification, id);
    });

    // Handler para ações de notificação
    ipcMain.on(NotificationIPCMessages.NotificationAction, (event, data: { notificationId: number; actionId: string }) => {
      console.log(`Ação executada: ${data.actionId} na notificação ${data.notificationId}`);
      this.activeNotifications.delete(data.notificationId);
      this.broadcastToAllDesktops(NotificationIPCMessages.CloseNotification, data.notificationId);
    });

    // Handler para limpar todas as notificações
    ipcMain.on(NotificationIPCMessages.ClearAllNotifications, (event) => {
      this.activeNotifications.clear();
      this.broadcastToAllDesktops(NotificationIPCMessages.ClearAllNotifications);
    });
  }

  private broadcastToAllDesktops(channel: string, ...args: any[]): void {
    this.desktopBrowsers.forEach(browser => {
      if (browser && !browser.isDestroyed()) {
        browser.webContents.send(channel, ...args);
      }
    });
  }

  public async start(): Promise<void> {
    try {
      const dbusObj = await this.bus.getProxyObject('org.freedesktop.DBus', '/org/freedesktop/DBus');
      const dbusInterface = dbusObj.getInterface('org.freedesktop.DBus');
      const names = await dbusInterface.ListNames();
      
      if (names.includes('org.freedesktop.Notifications')) {
        console.log('⚠️ Serviço de notificações já está em execução');
        return;
      }

      this.bus.export('/org/freedesktop/Notifications', this.notificationInterface);
      
      const result = await this.bus.requestName('org.freedesktop.Notifications', 0x4);
      if (result === RequestNameReply.PRIMARY_OWNER) {
        console.log('✅ Serviço de notificações registrado com sucesso');
      } else {
        console.warn('⚠️ Não foi possível registrar o serviço. Código:', result);
      }
    } catch (error) {
      console.error('Erro ao iniciar servidor DBus:', error);
    }
  }

  private handleNotification(notification: Notification): void {
    // Armazenar a notificação
    this.activeNotifications.set(notification.id, notification);
    
    // Enviar para todas as telas desktop via IPC
    this.broadcastToAllDesktops(NotificationIPCMessages.NewNotification, notification);
    
    console.log('📨 Nova notificação:', notification.summary);
  }

  private parseActions(actions: string[]): NotificationAction[] {
    const parsedActions: NotificationAction[] = [];
    
    // Actions vêm em pares: [id, label, id, label, ...]
    for (let i = 0; i < actions.length; i += 2) {
      if (actions[i + 1]) {
        parsedActions.push({
          id: actions[i],
          label: actions[i + 1]
        });
      }
    }
    
    return parsedActions;
  }
}

class NotificationInterface extends dbusInterface.Interface {
  private notificationCounter = 1;

  constructor(
    private notifyCallback: (notification: Notification) => void,
    private parseActions: (actions: string[]) => NotificationAction[]
  ) {
    super('org.freedesktop.Notifications');
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
      timestamp: Date.now()
    };

    this.notifyCallback(notification);
    return id;
  }

  CloseNotification(id: number): void {
    // Implementação opcional - poderia notificar o fechamento via IPC
  }

  GetCapabilities(): string[] {
    return ['body', 'actions', 'persistence', 'action-icons'];
  }

  GetServerInformation(): [string, string, string, string] {
    return [
      'Bond WM Notifications',
      'Bond WM',
      app.getVersion(),
      '1.2'
    ];
  }
}

// Configurar os membros da interface
(NotificationInterface as any).configureMembers({
  methods: {
    Notify: {
      inSignature: 'susssasa{sv}i',
      outSignature: 'u'
    },
    CloseNotification: {
      inSignature: 'u',
      outSignature: ''
    },
    GetCapabilities: {
      inSignature: '',
      outSignature: 'as'
    },
    GetServerInformation: {
      inSignature: '',
      outSignature: 'ssss'
    }
  }
});