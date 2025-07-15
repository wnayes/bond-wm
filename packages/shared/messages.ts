import { ContextMenuKind } from "./ContextMenuKind";

/** Message constants used in Electron IPC communication. */
export enum IPCMessages {
  RaiseWindow = "raise-window",
  MinimizeWindow = "minimize-window",
  MaximizeWindow = "maximize-window",
  RestoreWindow = "restore-window",
  CloseWindow = "close-window",
  FocusDesktopBrowser = "focus-desktop-browser",
  FrameWindowMouseEnter = "frame-window-mouse-enter",

  DesktopZoomIn = "desktop-zoom-in",
  DesktopZoomOut = "desktop-zoom-out",
  DesktopZoomReset = "desktop-zoom-reset",

  ExecDesktopEntry = "exec-desktop-entry",

  GetCompletionOptions = "completion-options-get",

  ShowDesktopDevTools = "show-desktop-dev-tools",
  ShowContextMenu = "show-context-menu",

  RegisterDesktopShortcut = "register-desktop-shortcut",
  UnregisterDesktopShortcut = "unregister-desktop-shortcut",

  SetFrameWid = "set-frame-wid",
}

export type CompletionOptionsCallback = (options: string[]) => void;

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

export interface ISetupIPCCallbacks {
  onInvokeDesktopShortcutHandler(keyString: string): void;
}

export interface ElectronWMIPCInterface {
  raiseWindow(wid: number): void;
  minimizeWindow(wid: number): void;
  maximizeWindow(wid: number): void;
  restoreWindow(wid: number): void;
  closeWindow(wid: number): void;
  focusDesktopBrowser({ screenIndex, takeVisualFocus }: { screenIndex: number; takeVisualFocus?: boolean }): void;
  frameWindowMouseEnter(wid: number): void;
  desktopZoomIn(screenIndex: number): void;
  desktopZoomOut(screenIndex: number): void;
  desktopZoomReset(screenIndex: number): void;
  executeDesktopEntry(entryName: string): void;
  showDevTools(screenIndex: number): void;
  showContextMenu(menuKind: ContextMenuKind): void;
  sendRegisterDesktopShortcut(keyString: string, screenIndex: number): void;
  sendUnregisterDesktopShortcut(keyString: string, screenIndex: number): void;

  // Métodos de notificação
  closeNotification(id: number): Promise<void>;
  invokeNotificationAction(id: number, action: string): Promise<void>;
  getActiveNotifications(): Promise<INotification[]>;
  onNotificationNew(callback: (notification: INotification) => void): void;
  onNotificationClose(callback: (id: number) => void): void;
  removeNotificationListeners(): void;

  setupIpc(callbacks: ISetupIPCCallbacks): void;
  getCompletionOptionsInit(): void;
  setOnCompletionOptionsResult(callback: CompletionOptionsCallback): void;

  registerFrameWidListener(callback: (wid: number) => void): void;
}
