import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { NotificationData } from "./types";

// Simple declaration for ipcRenderer
declare global {
  interface Window {
    ElectronNotifications?: {
      onNewNotification: (callback: (notification: NotificationData) => void) => void;
      onCloseNotification: (callback: (id: number) => void) => void;
      onClearAll: (callback: () => void) => void;
      sendNotificationClosed: (id: number) => void;
      sendNotificationAction: (notificationId: number, actionId: string) => void;
      sendClearAll: () => void;
      requestNotifications: () => void;
      removeListeners?: () => void;
    };
  }
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const timeoutRefs = useRef<Map<number, NodeJS.Timeout>>(new Map());

  // Memorizar se há notificações para evitar re-renderizações desnecessárias
  const hasNotifications = useMemo(() => notifications.length > 0, [notifications.length]);

  const removeNotification = useCallback((id: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));

    // Limpar timeout se existir
    const timeout = timeoutRefs.current.get(id);
    if (timeout) {
      clearTimeout(timeout);
      timeoutRefs.current.delete(id);
    }

    // Notificar o main process
    if (window.ElectronNotifications) {
      window.ElectronNotifications.sendNotificationClosed(id);
    }
  }, []);

  useEffect(() => {
    // Prevent multiple listeners
    if (!window.ElectronNotifications) {
      return () => {};
    }

    // Listen for new notifications
    const handleNewNotification = (notification: NotificationData) => {
      setNotifications((prev) => [notification, ...prev]);

      // Auto-remove after timeout (if specified)
      if (notification.expireTimeout > 0) {
        const timeout = setTimeout(() => {
          removeNotification(notification.id);
        }, notification.expireTimeout);
        timeoutRefs.current.set(notification.id, timeout);
      }
    };

    // Listen for notification close
    const handleCloseNotification = (id: number) => {
      removeNotification(id);
    };

    // Listen for clear all notifications
    const handleClearAll = () => {
      // Clear all timeouts
      timeoutRefs.current.forEach((timeout) => clearTimeout(timeout));
      timeoutRefs.current.clear();
      setNotifications([]);
    };

    // Register listeners
    window.ElectronNotifications.onNewNotification(handleNewNotification);
    window.ElectronNotifications.onCloseNotification(handleCloseNotification);
    window.ElectronNotifications.onClearAll(handleClearAll);

    // Request existing notifications on initialize
    window.ElectronNotifications.requestNotifications();

    return () => {
      // Clear all timeouts
      timeoutRefs.current.forEach((timeout) => clearTimeout(timeout));
      timeoutRefs.current.clear();

      // Remove listeners if available
      if (window.ElectronNotifications && typeof window.ElectronNotifications.removeListeners === "function") {
        window.ElectronNotifications.removeListeners();
      }
    };
  }, [removeNotification]);

  const executeAction = useCallback((notificationId: number, actionId: string) => {
    // Notify the main process about the action
    if (window.ElectronNotifications) {
      window.ElectronNotifications.sendNotificationAction(notificationId, actionId);
    }
  }, []);

  const clearAll = useCallback(() => {
    timeoutRefs.current.forEach((timeout) => clearTimeout(timeout));
    timeoutRefs.current.clear();
    setNotifications([]);

    // Notify the main process
    if (window.ElectronNotifications) {
      window.ElectronNotifications.sendClearAll();
    }
  }, []);

  return {
    notifications,
    hasNotifications,
    removeNotification,
    executeAction,
    clearAll,
  };
}
