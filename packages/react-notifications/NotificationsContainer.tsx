import React from "react";
import { ChildWindow, Stylesheet, useTheme } from "@bond-wm/react";
import { useNotifications } from "./useNotifications";
import { NotificationCard } from "./NotificationCard";
import styles from "./NotificationsStyles.css?url";


interface NotificationsStyle extends React.CSSProperties {
  "--notification-bg-color": string;
  "--notification-border-color": string;
  "--notification-text-color": string;
  "--notification-app-name-color": string;
  "--notification-time-color": string;
  "--notification-close-color": string;
  "--notification-close-hover-bg": string;
  "--notification-summary-color": string;
  "--notification-message-color": string;
  "--notification-action-border": string;
  "--notification-action-bg": string;
  "--notification-action-color": string;
  "--notification-action-hover-bg": string;
  "--notification-action-hover-border": string;
  "--notification-progress-color": string;
}

export function NotificationsContainer() {
  const { notifications, closeNotification, invokeAction } = useNotifications();
  const theme = useTheme();

  if (notifications.length === 0) {
    return null;
  }

  // Calculate height based on actual notification content
  // Estimate: ~100px per notification + padding + gaps
  const estimatedNotificationHeight = 100; // base height per notification
  const containerPadding = 24; // body padding (12px x 2)
  const gapBetweenNotifications = 12 * (notifications.length - 1); // gaps between notifications
  
  const containerHeight = (notifications.length * estimatedNotificationHeight) + containerPadding + gapBetweenNotifications;
  const containerWidth = 350;

  // Adjust Y position so the container doesn't go off screen
  const maxHeight = window.screen.height - 40; // 40px margin from bottom
  const finalHeight = Math.min(containerHeight, maxHeight);
  const positionY = containerHeight > maxHeight ? 20 : 20;

  const notificationsStyle: NotificationsStyle = {
    "--notification-bg-color": "rgba(30, 30, 30, 0.95)",
    "--notification-border-color": "rgba(255, 255, 255, 0.2)",
    "--notification-text-color": "#ffffff",
    "--notification-app-name-color": "rgba(255, 255, 255, 0.7)",
    "--notification-time-color": "rgba(255, 255, 255, 0.5)",
    "--notification-close-color": "rgba(255, 255, 255, 0.7)",
    "--notification-close-hover-bg": "rgba(255, 255, 255, 0.1)",
    "--notification-summary-color": "#ffffff",
    "--notification-message-color": "rgba(255, 255, 255, 0.9)",
    "--notification-action-border": "rgba(255, 255, 255, 0.3)",
    "--notification-action-bg": "transparent",
    "--notification-action-color": "#ffffff",
    "--notification-action-hover-bg": "rgba(255, 255, 255, 0.1)",
    "--notification-action-hover-border": "rgba(255, 255, 255, 0.5)",
    "--notification-progress-color": theme.primaryColor ?? "#007acc",
  };



  return (
    <ChildWindow
      alwaysOnTop
      autoFocus={false}
      position={{ x: window.screen.width - containerWidth - 20, y: positionY }}
      size={{ width: containerWidth, height: finalHeight }}
    >
      <Stylesheet href={styles} />
      <div className="notificationsContainer" style={notificationsStyle}>
        {notifications.map(notification => (
          <NotificationCard
            key={notification.id}
            notification={notification}
            onClose={closeNotification}
            onAction={invokeAction}
          />
        ))}
      </div>
    </ChildWindow>
  );
}
