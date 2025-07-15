import { useEffect, useState, useCallback } from "react";
import { INotification, ElectronWMIPCInterface } from "@bond-wm/shared";

// Use augmentation instead of declaration to add to existing interface
declare global {
  interface Window {
    // Make sure to use the same interface as in shared-renderer/commands.ts
    ElectronWM: ElectronWMIPCInterface;
  }
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<INotification[]>([]);

  // Função para adicionar nova notificação
  const addNotification = useCallback((notification: INotification) => {
    setNotifications(prev => {
      // Se já existe uma notificação com o mesmo ID, substitui
      const filtered = prev.filter(n => n.id !== notification.id);
      return [...filtered, notification].sort((a, b) => b.timestamp - a.timestamp);
    });
  }, []);

  // Função para remover notificação
  const removeNotification = useCallback((id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  // Função para fechar notificação (envia evento para main process)
  const closeNotification = useCallback(async (id: number) => {
    try {
      await window.ElectronWM.closeNotification(id);
    } catch (error) {
      console.error('Failed to close notification:', error);
      // Remove localmente mesmo se falhar no main process
      removeNotification(id);
    }
  }, [removeNotification]);

  // Função para invocar ação de notificação
  const invokeAction = useCallback(async (id: number, action: string) => {
    console.log(`[REACT] Invoking action: ${action} for notification ${id}`);
    try {
      console.log(`[REACT] Calling window.ElectronWM.invokeNotificationAction(${id}, '${action}')`);
      await window.ElectronWM.invokeNotificationAction(id, action);
      console.log(`[REACT] Action invoked successfully: ${action} for notification ${id}`);
    } catch (error) {
      console.error(`[REACT] Failed to invoke notification action:`, error);
    }
  }, []);

  // Função para obter notificações ativas do main process
  const getActiveNotifications = useCallback(async () => {
    try {
      console.log('Requesting active notifications from main process...');
      if (!window.ElectronWM || typeof window.ElectronWM.getActiveNotifications !== 'function') {
        console.error('ElectronWM.getActiveNotifications is not available!', window.ElectronWM);
        return;
      }
      
      const active = await window.ElectronWM.getActiveNotifications();
      console.log('Received active notifications:', active);
      setNotifications(active.sort((a: INotification, b: INotification) => b.timestamp - a.timestamp));
    } catch (error) {
      console.error('Failed to get active notifications:', error);
    }
  }, []);

  useEffect(() => {
    const handleNewNotification = (notification: INotification) => {
      addNotification(notification);
    };

    const handleCloseNotification = (id: number) => {
      removeNotification(id);
    };

    // Registra listeners para eventos do main process
    window.ElectronWM.onNotificationNew(handleNewNotification);
    window.ElectronWM.onNotificationClose(handleCloseNotification);

    // Carrega notificações ativas na inicialização
    getActiveNotifications();

    // Cleanup
    return () => {
      window.ElectronWM.removeNotificationListeners();
    };
  }, [addNotification, removeNotification, getActiveNotifications]);

  // Auto-remove notificações expiradas
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setNotifications(prev => 
        prev.filter(notification => {
          if (notification.expire_timeout <= 0) return true; // Não expira
          return (now - notification.timestamp) < notification.expire_timeout;
        })
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return {
    notifications,
    closeNotification,
    invokeAction,
    getActiveNotifications
  };
}
