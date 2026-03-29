---
sidebar_position: 3
---

# Notifications

bond-wm includes a desktop notification server and a React notification UI.

## What Is Supported

- D-Bus service at `org.freedesktop.Notifications`
- notification list with optional actions
- close one notification or clear all
- optional expiry timeout from sender
- renderer and WM process synchronization via IPC

## Enabling the UI

In the default React config, notifications are shown with:

```tsx
{screenIndex === 0 && <NotificationWindow />}
```

If this component is removed, notifications can still be received by the WM,
but users will not see the rendered notification list.

## Notification Window Options

`NotificationWindow` accepts:

- `maxNotifications` (default: `5`)
- `showHeader` (default: `true`)

Example:

```tsx
<NotificationWindow maxNotifications={8} showHeader={false} />
```

## Actions

If a notification includes actions, each action is rendered as a button.
Clicking an action sends a D-Bus action invocation event and closes that
notification entry.

## Notes

- The default template renders notifications only on screen 0.
- `Clear All` clears local state and notifies the WM process.
- If another notification daemon is already owning
  `org.freedesktop.Notifications`, bond-wm may not become the primary owner.
