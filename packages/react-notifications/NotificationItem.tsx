import React, { memo, useCallback, useState } from "react";
import { NotificationData } from "./types";

export interface NotificationItemProps {
  notification: NotificationData;
  onClose: (id: number) => void;
  onAction: (notificationId: number, actionId: string) => void;
}

export const NotificationItem = memo(function NotificationItem({
  notification,
  onClose,
  onAction,
}: NotificationItemProps) {
  const { id, appName, summary, body, actions, appIcon } = notification;
  const [processingAction, setProcessingAction] = useState<string | null>(null);

  const handleClose = useCallback(() => {
    onClose(id);
  }, [id, onClose]);

  const handleAction = useCallback(
    async (actionId: string) => {
      setProcessingAction(actionId);

      try {
        console.log(`📞 Chamando onAction(${id}, '${actionId}')`);
        onAction(id, actionId);

        // Visual feedback for processing
        setTimeout(() => {
          setProcessingAction(null);
        }, 1000);
      } catch (error) {
        setProcessingAction(null);
      }
    },
    [id, onAction, notification]
  );

  const handleImageError = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    // hide icon if it fails to load
    (e.target as HTMLImageElement).style.display = "none";
  }, []);

  return (
    <div className="notification-item" data-notification-id={id}>
      <div className="notification-header">
        {appIcon && (
          <img src={appIcon} alt={`${appName} icon`} className="notification-icon" onError={handleImageError} />
        )}
        <div className="notification-app-name">{appName}</div>
        <button className="notification-close-btn" onClick={handleClose} aria-label="Close Notification">
          ×
        </button>
      </div>

      <div className="notification-content">
        <div className="notification-summary">{summary}</div>
        {body && <div className="notification-body">{body}</div>}
      </div>

      {actions && actions.length > 0 && (
        <div className="notification-actions">
          {actions.map((action) => {
            const isProcessing = processingAction === action.id;
            return (
              <button
                key={action.id}
                className="notification-action-btn"
                onClick={() => handleAction(action.id)}
                disabled={processingAction !== null}
                style={{
                  opacity: processingAction && !isProcessing ? 0.5 : 1,
                  cursor: processingAction ? "not-allowed" : "pointer",
                }}
                title={action.label}
              >
                {isProcessing ? <>⏳</> : <>{action.label}</>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
});
