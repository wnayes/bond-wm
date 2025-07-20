import React, { memo, useCallback } from 'react';
import { NotificationData } from './types';

export interface NotificationItemProps {
  notification: NotificationData;
  onClose: (id: number) => void;
  onAction: (notificationId: number, actionId: string) => void;
}

export const NotificationItem = memo(function NotificationItem({ 
  notification, 
  onClose, 
  onAction 
}: NotificationItemProps) {
  const { id, appName, summary, body, actions, appIcon } = notification;

  const handleClose = useCallback(() => {
    onClose(id);
  }, [id, onClose]);

  const handleAction = useCallback((actionId: string) => {
    onAction(id, actionId);
  }, [id, onAction]);

  const handleImageError = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    // hide icon if it fails to load
    (e.target as HTMLImageElement).style.display = 'none';
  }, []);

  return (
    <div className="notification-item" data-notification-id={id}>
      <div className="notification-header">
        {appIcon && (
          <img 
            src={appIcon} 
            alt={`${appName} icon`}
            className="notification-icon"
            onError={handleImageError}
          />
        )}
        <div className="notification-app-name">{appName}</div>
        <button 
          className="notification-close-btn"
          onClick={handleClose}
          aria-label="Close Notification"
        >
          ×
        </button>
      </div>
      
      <div className="notification-content">
        <div className="notification-summary">{summary}</div>
        {body && <div className="notification-body">{body}</div>}
      </div>

      {actions && actions.length > 0 && (
        <div className="notification-actions">
          {actions.map(action => (
            <button
              key={action.id}
              className="notification-action-btn"
              onClick={() => handleAction(action.id)}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
});
