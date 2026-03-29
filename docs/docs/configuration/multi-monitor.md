---
sidebar_position: 4
---

# Multi-Monitor Behavior

bond-wm supports multiple X11 screens via Xinerama data.

## Key Concepts

- Each screen has its own work area geometry.
- Each screen has its own current tags.
- Each screen tracks current layout per tag.
- A single config can be customized per screen via `screenOverrides`.

## Per-Screen Overrides

Use `screenOverrides` in your config:

```ts
screenOverrides: {
  0: {
    initialLayout: "Floating",
  },
  1: {
    initialLayout: "Tiling",
    tags: ["web", "code", "chat"],
    initialTag: "web",
  },
}
```

## Sending Windows Between Screens

Default shortcut:

- `Mod4 + O`: send focused window to next screen

When moving a window to another screen, bond-wm attempts to:

- preserve matching tags if possible
- otherwise place the window on the first visible tag of the destination screen
- fit the geometry into the destination work area

## Screen-Scoped UI in React

Use `useScreenIndex()` to render UI differently per monitor:

```tsx
const screenIndex = useScreenIndex();

{
  screenIndex === 0 && <SystemTray />;
}
{
  screenIndex === 0 && <NotificationWindow />;
}
```

## Screen-Relative Child Windows

For popups and overlays, use `ChildWindow` with `positionMode="screen-relative"`.

This keeps coordinates anchored to the current screen instead of global desktop coordinates.

## Tags Across Screens

Tags are screen-local in practice:

- switching tags affects the active desktop under pointer focus
- sending a window to a tag uses the focused window's current screen

Default shortcuts:

- `Mod4 + 1..9`: switch active desktop tag
- `Mod4 + Shift + 1..9`: send focused window to tag
