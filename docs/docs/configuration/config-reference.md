---
sidebar_position: 1
---

# Configuration Reference

This page documents the `IConfig` object exported by your config package
(for example `@bond-wm/react-config` or your own fork).

## Minimal Example

```ts
import type { IConfig } from "@bond-wm/shared";
import { createFloatingLayout } from "@bond-wm/layout-floating";
import LayoutTiling from "@bond-wm/layout-tiling";

const config: IConfig = {
  initialLayout: "Floating",
  initialTag: "1",
  tags: ["1", "2", "3", "4", "5", "6", "7", "8", "9"],
  layouts: [createFloatingLayout({ floatRight: false }), LayoutTiling],

  onWindowManagerReady: ({ wm }) => {
    wm.registerShortcuts({
      "Mod4 + Return": () => wm.launchProcess("xterm"),
      "Mod4 + space": () => wm.switchToNextLayout(),
      "Mod4 + Shift + Q": () => wm.quit(),
    });
  },
};

export default config;
```

## Properties

### `initialLayout`

The layout name to use initially on each screen/tag.

- Must match the `name` of one of your layout plugins.
- In the default React config this is `"Floating"`.

### `initialTag`

The tag selected initially for each screen.

- Must exist in `tags`.
- In the default React config this is `"1"`.

### `tags`

The list of virtual desktop labels.

- Common pattern: `["1", ..., "9"]`
- These labels are what users see in `TagList`.

### `layouts`

Array of layout plugins available to cycle through.

A layout plugin contains:

- `name: string`
- `icon: string`
- `supportsMaximize: boolean`
- `fn: ({ windows, screen }) => Map<wid, geometry>`

### `screenOverrides`

Optional per-screen overrides for config values.

```ts
screenOverrides: {
  1: {
    initialTag: "2",
    layouts: [LayoutTiling],
    tags: ["1", "2", "3"],
  },
}
```

This is useful for asymmetric monitor setups.

### `onWindowManagerReady({ wm })`

Called once when the WM has started. Use this to register shortcuts and
startup behavior.

### `onWindowCreated({ win, state })`

Called before a new window is managed.

You can customize initial behavior by mutating `win`, for example:

- placing a window on a different screen (`win.screenIndex`)
- setting initial tags (`win.tags`)
- changing frame/decorated behavior (`win.decorated`)

## Common Recipes

### Use custom app launchers

```ts
onWindowManagerReady: ({ wm }) => {
  wm.registerShortcuts({
    "Mod4 + Return": () => wm.launchProcess("kitty"),
    "Mod4 + r": () => wm.launchProcess("rofi -show drun"),
    "Mod4 + e": () => wm.launchProcess("thunar"),
  });
};
```

### Move focused window to another tag

```ts
wm.registerShortcuts({
  "Mod4 + Shift + 1": () => wm.sendActiveWindowToTag(0),
  "Mod4 + Shift + 2": () => wm.sendActiveWindowToTag(1),
});
```

### Configure a different layout set on monitor 2

```ts
screenOverrides: {
  1: {
    layouts: [LayoutTiling],
    initialLayout: "Tiling",
  },
},
```

## Where This Is Loaded From

At runtime, `bond-wm` resolves your config from:

1. `--config <path-or-package>` if provided
2. otherwise `${XDG_CONFIG_HOME}/bond-wm-config`

See [Running](../getting-started/running) and
[CLI and Runtime Flags](../usage/cli-and-runtime-flags).
