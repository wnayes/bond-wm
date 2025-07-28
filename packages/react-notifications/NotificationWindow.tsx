import React, { memo, useEffect } from "react";
import { ChildWindow, useScreen } from "@bond-wm/react";
import { NotificationContainer } from "./NotificationContainer";
import { useNotifications } from "./useNotifications";

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
  const { hasNotifications } = useNotifications();
  useEffect(() => {
    // Mount: nothing to do, listeners are already registered by the hook
    return () => {
      // Unmount: remove global listeners
      if (window.ElectronNotifications?.removeListeners) {
        window.ElectronNotifications.removeListeners();
      }
    };
  }, []);

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
