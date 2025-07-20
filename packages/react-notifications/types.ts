export interface NotificationData {
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

export interface NotificationState {
  notifications: NotificationData[];
}

// Mensagens IPC para notificações
export const NotificationIPCMessages = {
  // Main -> Renderer
  NewNotification: 'notification:new',
  CloseNotification: 'notification:close',
  ClearAllNotifications: 'notification:clear-all',
  
  // Renderer -> Main
  NotificationAction: 'notification:action',
  NotificationClosed: 'notification:user-closed',
  RequestNotifications: 'notification:request-all',
} as const;
