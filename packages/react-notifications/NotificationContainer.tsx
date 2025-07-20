import React, { memo, useMemo } from 'react';
import { Stylesheet } from '@bond-wm/react';
import { useNotificationContext } from './NotificationContext';
import { NotificationItem } from './NotificationItem';
import styles from './NotificationStyles.css?url';

export interface NotificationContainerProps {
  maxNotifications?: number;
  showHeader?: boolean;
}

export const NotificationContainer = memo(function NotificationContainer({ 
  maxNotifications = 5, 
  showHeader = true 
}: NotificationContainerProps) {
  const { notifications, removeNotification, executeAction, clearAll } = useNotificationContext();
  
  // Memorizar as notificações visíveis para evitar re-cálculos desnecessários
  const visibleNotifications = useMemo(() => {
    if (!notifications || !Array.isArray(notifications)) {
      return [];
    }
    return notifications.slice(0, maxNotifications);
  }, [notifications, maxNotifications]);
  
  // Early return se não há notificações
  if (visibleNotifications.length === 0) {
    return null;
  }
  
  return (
    <>
      <Stylesheet href={styles} />
      <div className="notifications-container">
        {showHeader && (
          <div className="notifications-header">
            <div className="notifications-title">
              Notifications ({notifications.length})
            </div>
            <button 
              className="notifications-clear-btn"
              onClick={clearAll}
            >
              Clear All
            </button>
          </div>
        )}
        
        <div className="notifications-list">
          {visibleNotifications.map(notification => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onClose={removeNotification}
              onAction={executeAction}
            />
          ))}
        </div>
      </div>
    </>
  );
});
