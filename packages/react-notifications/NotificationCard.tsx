import React, { useEffect, useState } from "react";
import { INotification } from "@bond-wm/shared";

interface NotificationCardProps {
  notification: INotification;
  onClose: (id: number) => void;
  onAction: (id: number, action: string) => void;
}

export function NotificationCard({ notification, onClose, onAction }: NotificationCardProps) {
  const { id, app_name, summary, body, actions, app_icon, expire_timeout, timestamp } = notification;
  const [visible, setVisible] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  // Parse actions array (format: ["key", "label", "key", "label", ...])
  const actionButtons = [];
  for (let i = 0; i < actions.length; i += 2) {
    if (i + 1 < actions.length) {
      actionButtons.push({
        key: actions[i],
        label: actions[i + 1]
      });
    }
  }

  // Calculate remaining time
  useEffect(() => {
    if (expire_timeout <= 0) {
      setTimeRemaining(null);
      return;
    }

    const updateTime = () => {
      const elapsed = Date.now() - timestamp;
      const remaining = Math.max(0, expire_timeout - elapsed);
      setTimeRemaining(Math.ceil(remaining / 1000));

      if (remaining <= 0) {
        handleClose();
        clearInterval(interval);
      }
    };

    // Initialization
    updateTime();
    
    // Update by timer
    const interval = setInterval(updateTime, 1000);
    
    return () => clearInterval(interval);
  }, [expire_timeout, timestamp, id]);

  const handleClose = () => {
    setVisible(false);
    // Small delay to animate the exit
    setTimeout(() => onClose(id), 300);
  };

  const handleAction = (actionKey: string) => {
    if (isProcessingAction) {
      console.log(`Action ${actionKey} already being processed, ignoring...`);
      return;
    }

    console.log(`Action invoked: ${actionKey} for notification ${id}`);
    setIsProcessingAction(true);
    
    // Send action to main process via IPC
    onAction(id, actionKey);
    
    // Reset state after some time
    setTimeout(() => {
      setIsProcessingAction(false);
    }, 2000);
    
    // Do NOT close automatically - let the application decide
    // If needed, the application can close via D-Bus
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const progressPercentage = timeRemaining !== null && expire_timeout > 0 
    ? Math.max(0, Math.min(100, (timeRemaining / (expire_timeout / 1000)) * 100))
    : 0;

  return (
    <div className={`notificationCard ${visible ? 'visible' : 'hidden'}`}>
      <div className="notificationHeader">
        {app_icon && (
          <img 
            src={app_icon} 
            alt={app_name} 
            className="notificationIcon"
            onError={(e) => {
              // Remove icon if it fails to load
              e.currentTarget.style.display = 'none';
            }}
          />
        )}
        <div className="notificationAppName">{app_name}</div>
        <div className="notificationTime">{formatTime(timestamp)}</div>
        <button 
          className="notificationCloseButton"
          onClick={handleClose}
          aria-label="Close notification"
        >
          ×
        </button>
      </div>
      
      <div className="notificationBody">
        <div className="notificationSummary">{summary}</div>
        {body && <div className="notificationMessage">{body}</div>}

        {actionButtons.length > 0 && (
          <div className="notificationActions">
            {actionButtons.map(({ key, label }) => (
              <button
                key={key}
                className="notificationActionButton"
                onClick={() => handleAction(key)}
                disabled={isProcessingAction}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      {timeRemaining !== null && (
        <div 
          className="notificationProgress" 
          style={{ width: `${progressPercentage}%` }}
        />
      )}
    </div>
  );
}
