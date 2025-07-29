import React, { memo, useCallback, useState } from "react";
import { NotificationData } from "./types";
import { useTheme } from "@bond-wm/react";

export interface NotificationItemProps {
  notification: NotificationData;
  onClose: (id: number) => void;
  onAction: (notificationId: number, actionId: string) => void;
}

interface NotificationStyle extends React.CSSProperties {
  "--notification-bg-color": string;
  "--notification-fore-color": string;
  "--notification-app-name-color": string;
  "--notification-action-bg": string;
  "--notification-action-border": string;
  "--notification-action-color": string;
  "--notification-clear-btn-bg": string;
  "--notification-clear-btn-color": string;
}

export const NotificationItem = memo(function NotificationItem({
  notification,
  onClose,
  onAction,
}: NotificationItemProps) {
  const { id, appName, summary, body, actions, appIcon } = notification;
  const [processingAction, setProcessingAction] = useState<string | null>(null);
  const theme = useTheme();
  const notificationItemStyle: NotificationStyle = {
    "--notification-bg-color":
      theme.notification?.backgroundColor ?? theme.window?.inactiveBackgroundColor ?? "rgba(0,0,0,0.8)",
    "--notification-fore-color": theme.notification?.foreColor ?? theme.window?.foreColor ?? "white",
    "--notification-app-name-color": theme.notification?.appNameColor ?? theme.primaryColor,
    "--notification-action-bg": theme.notification?.actionBg ?? theme.primaryColor,
    "--notification-action-border": theme.notification?.actionBorder ?? theme.primaryColor,
    "--notification-action-color": theme.notification?.actionColor ?? theme.window?.foreColor ?? "white",
    "--notification-clear-btn-bg": theme.notification?.clearBtnBg ?? theme.primaryColor,
    "--notification-clear-btn-color": theme.notification?.clearBtnColor ?? theme.window?.foreColor ?? "white",
  } as NotificationStyle;

  const handleClose = useCallback(() => {
    onClose(id);
  }, [id, onClose]);

  const handleAction = useCallback(
    async (actionId: string) => {
      setProcessingAction(actionId);

      try {
        onAction(id, actionId);

        // Visual feedback for processing
        setTimeout(() => {
          setProcessingAction(null);
        }, 1000);
      } catch (error) {
        console.error("Error processing action:", error);
        setProcessingAction(null);
      }
    },
    [id, onAction]
  );

  const handleImageError = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    // hide icon if it fails to load
    (e.target as HTMLImageElement).style.display = "none";
  }, []);

  return (
    <div className="notification-item" data-notification-id={id} style={notificationItemStyle}>
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
