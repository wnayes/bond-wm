import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { NotificationData, NotificationIPCMessages } from './types';

// Declaração simples para o ipcRenderer
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
    setNotifications(prev => prev.filter(n => n.id !== id));
    
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
    // Evitar múltiplos listeners
    if (!window.ElectronNotifications) {
      return () => {};
    }

    // Escutar novas notificações
    const handleNewNotification = (notification: NotificationData) => {
      setNotifications(prev => [notification, ...prev]);
      
      // Auto-remover após o timeout (se especificado)
      if (notification.expireTimeout > 0) {
        const timeout = setTimeout(() => {
          removeNotification(notification.id);
        }, notification.expireTimeout);
        timeoutRefs.current.set(notification.id, timeout);
      }
    };

    // Escutar fechamento de notificação
    const handleCloseNotification = (id: number) => {
      removeNotification(id);
    };

    // Escutar limpeza de todas as notificações
    const handleClearAll = () => {
      // Limpar todos os timeouts
      timeoutRefs.current.forEach(timeout => clearTimeout(timeout));
      timeoutRefs.current.clear();
      setNotifications([]);
    };

    // Registrar listeners
    window.ElectronNotifications.onNewNotification(handleNewNotification);
    window.ElectronNotifications.onCloseNotification(handleCloseNotification);
    window.ElectronNotifications.onClearAll(handleClearAll);

    // Solicitar notificações existentes ao inicializar
    window.ElectronNotifications.requestNotifications();

    // Cleanup adequado
    return () => {
      // Limpar todos os timeouts
      timeoutRefs.current.forEach(timeout => clearTimeout(timeout));
      timeoutRefs.current.clear();
      
      // Remover listeners se disponível
      if (window.ElectronNotifications?.removeListeners) {
        window.ElectronNotifications.removeListeners();
      }
    };
  }, [removeNotification]);

  const executeAction = useCallback((notificationId: number, actionId: string) => {
    // Notificar o main process sobre a ação
    if (window.ElectronNotifications) {
      window.ElectronNotifications.sendNotificationAction(notificationId, actionId);
    }
    
    // Remover a notificação após executar ação
    removeNotification(notificationId);
  }, [removeNotification]);

  const clearAll = useCallback(() => {
    // Limpar todos os timeouts
    timeoutRefs.current.forEach(timeout => clearTimeout(timeout));
    timeoutRefs.current.clear();
    setNotifications([]);
    
    // Notificar o main process
    if (window.ElectronNotifications) {
      window.ElectronNotifications.sendClearAll();
    }
  }, []);

  return {
    notifications,
    hasNotifications,
    removeNotification,
    executeAction,
    clearAll
  };
}
