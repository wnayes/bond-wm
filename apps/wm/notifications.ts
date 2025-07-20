import { app, nativeImage, dialog, BrowserWindow } from 'electron';
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
}

export interface DBusHints {
  [key: string]: Variant;
}

export class NotificationServer {
  private bus = dbus.sessionBus();
  private notificationCounter = 1;
  private activeNotifications = new Map<number, Notification>();
  private notificationInterface: NotificationInterface;
  private mainWindow: BrowserWindow | null = null;

  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow;
    this.notificationInterface = new NotificationInterface(
      this.handleNotification.bind(this)
    );
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
    this.showNotificationAlert(notification);
  }

  private showNotificationAlert(notification: Notification): void {
    if (!this.mainWindow || !this.mainWindow.isVisible()) return;
    
    const options: Electron.MessageBoxOptions = {
      type: 'info',
      title: `Nova Notificação (${notification.id})`,
      message: notification.summary,
      detail: `${notification.body}\n\nApp: ${notification.appName}`,
      buttons: ['OK', 'Fechar Notificação'],
      noLink: true
    };

    if (notification.appIcon) {
      try {
        options.icon = nativeImage.createFromPath(notification.appIcon);
      } catch (e) {
        console.warn('Erro ao carregar ícone:', notification.appIcon);
      }
    }

    dialog.showMessageBox(this.mainWindow, options).then(({ response }) => {
      if (response === 1) {
        console.log(`Usuário fechou notificação ${notification.id}`);
      }
    });
  }
}

class NotificationInterface extends dbusInterface.Interface {
  private notificationCounter = 1;

  constructor(
    private notifyCallback: (notification: Notification) => void
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
      expireTimeout
    };

    this.notifyCallback(notification);
    return id;
  }

  CloseNotification(id: number): void {
    // Implementação opcional
  }

  GetCapabilities(): string[] {
    return ['body', 'actions', 'persistence'];
  }

  GetServerInformation(): [string, string, string, string] {
    return [
      'Electron Notifier',
      'Electron',
      app.getVersion(),
      '1.0'
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