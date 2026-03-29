---
sidebar_position: 2
---

# React Config Guide

The default React template (`@bond-wm/react-config`) has two renderer entry points:

- `desktop/desktop.tsx`: your desktop UI (taskbar, wallpaper, start menu, etc.)
- `frame/frame.tsx`: your window frame UI (titlebar and client area wrapper)

## Desktop Composition

A simplified example:

```tsx
<Desktop>
  <Taskbar height={20}>
    <StartMenuButton>{/* ... */}</StartMenuButton>
    <TagList />
    <TaskList />
    <SystemTray />
    <Clock />
    <LayoutIndicator />
  </Taskbar>

  <WorkArea>
    <Wallpaper />
    <DesktopEntries />
  </WorkArea>

  <NotificationWindow />
</Desktop>
```

## Frame Composition

The default frame wraps windows with a titlebar and standard controls:

```tsx
<WindowFrame>
  <TitleBar>
    <TitleBarIcon />
    <TitleBarText />
    <TitleBarMinimizeButton />
    <TitleBarMaximizeButton />
    <TitleBarCloseButton />
  </TitleBar>
  <WindowClientArea />
</WindowFrame>
```

## Theme Customization

The template uses `ThemeContextProvider` with a `Theme` object.

Typical theme controls:

- global: `fontFamily`, `primaryColor`, `urgentColor`
- window frame/titlebar colors
- taskbar/taglist/tasklist/clock colors
- start menu colors
- notification colors
- desktop work area color

See the template example in `packages/react-config/theme.ts`.

## Screen-Aware Rendering

`useScreenIndex()` lets you conditionally render by monitor.

The default template uses this to show one system tray and one notification area
(on `screenIndex === 0`) while still showing taskbar/tag/task list on all screens.

## Child Windows

`ChildWindow` is used for floating UI surfaces such as:

- start menu popups
- notification panes

It supports:

- absolute positioning
- `positionMode="screen-relative"`
- `alwaysOnTop`
- controlled size and focus behavior

## Helpful Hooks

From `@bond-wm/react`, common hooks include:

- `useScreenIndex`, `useScreen`, `useScreens`
- `useWindows`
- `useLayoutPlugins`
- `useDesktopEntries`
- `useDesktopShortcut`
- `useSupportsMaximize`

## Desktop Shortcuts in Renderer Code

In desktop React code, you can register shortcuts scoped to desktop focus:

```tsx
useDesktopShortcut("Mod4 + p", { desktopTakesFocus: true }, () => {
  // custom action
});
```

For global WM behavior, prefer `wm.registerShortcuts(...)` in `onWindowManagerReady`.
