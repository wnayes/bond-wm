import React, { createContext, useContext, ReactNode } from "react";
import { useNotifications } from "./useNotifications";
import { NotificationData } from "./types";

interface NotificationContextType {
  notifications: NotificationData[];
  hasNotifications: boolean;
  removeNotification: (id: number) => void;
  executeAction: (notificationId: number, actionId: string) => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

interface NotificationProviderProps {
  children: ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const notificationState = useNotifications();

  return <NotificationContext.Provider value={notificationState}>{children}</NotificationContext.Provider>;
}

export function useNotificationContext() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotificationContext must be used within a NotificationProvider");
  }
  return context;
}
