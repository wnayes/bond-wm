---
sidebar_position: 3
---

# Layouts

Layouts control how windows are arranged per screen/tag.

## Built-in Layouts

### Floating (`@bond-wm/layout-floating`)

- Preserves user-positioned windows
- Supports maximize
- Can place new windows left-to-right or right-to-left (`floatRight`)

```ts
import { createFloatingLayout } from "@bond-wm/layout-floating";

const layouts = [createFloatingLayout({ floatRight: false })];
```

### Tiling (`@bond-wm/layout-tiling`)

- Places non-floating windows into a grid
- Preserves user-positioned windows
- `supportsMaximize` is `false`

```ts
import LayoutTiling from "@bond-wm/layout-tiling";

const layouts = [LayoutTiling];
```

## Switching Layouts

The default config binds layout cycling to:

- `Mod4 + Space`

This rotates through the order specified in `config.layouts`.

## Layout Plugin Shape

A layout plugin has this shape:

```ts
interface LayoutPluginConfig {
  name: string;
  icon: string;
  supportsMaximize: boolean;
  fn: ({ windows, screen }) => Map<number, { x: number; y: number; width: number; height: number }>;
}
```

## Writing a Custom Layout

```ts
import type { LayoutPluginConfig } from "@bond-wm/shared";

const MyLayout: LayoutPluginConfig = {
  name: "My Layout",
  icon: "data:image/svg+xml;base64,...",
  supportsMaximize: true,
  fn: ({ windows, screen }) => {
    const result = new Map();

    let y = screen.workArea.y;
    const h = Math.max(120, Math.floor(screen.workArea.height / Math.max(1, windows.length)));

    for (const win of windows) {
      result.set(win.id, {
        x: screen.workArea.x,
        y,
        width: screen.workArea.width,
        height: h,
      });
      y += h;
    }

    return result;
  },
};

export default MyLayout;
```

## Notes

- Layout changes reset `UserPositioned` flags to allow consistent re-layout.
- Layout selection is tracked per tag, per screen.
- The `LayoutIndicator` component shows and toggles current layout.
