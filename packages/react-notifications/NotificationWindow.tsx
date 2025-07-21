import React, { memo } from "react";
import { ChildWindow, useScreen } from "@bond-wm/react";
import { NotificationContainer } from "./NotificationContainer";
import { useNotificationContext } from "./NotificationContext";

const TaskbarHeight = 20;

export interface NotificationWindowProps {
  maxNotifications?: number;
  showHeader?: boolean;
}

export const NotificationWindow = memo(function NotificationWindow({
  maxNotifications = 5,
  showHeader = true,
}: NotificationWindowProps) {
  const screen = useScreen();
  const { hasNotifications } = useNotificationContext();

  // Early return if there are no notifications - avoids creating unnecessary ChildWindow
  if (!hasNotifications) {
    return null;
  }

  // if screen dimensions are not available, return null
  if (!screen?.width || !screen?.height) {
    return null;
  }

  return (
    <ChildWindow
      alwaysOnTop
      autoFocus={false}
      position={{ x: screen.width - 300, y: TaskbarHeight }}
      size={{ width: 300, height: screen.height - TaskbarHeight }}
    >
      <NotificationContainer maxNotifications={maxNotifications} showHeader={showHeader} />
    </ChildWindow>
  );
});
