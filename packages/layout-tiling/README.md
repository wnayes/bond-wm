# @bond-wm/layout-tiling

A default tiling layout for the `bond-wm` window manager.

## Usage

Import and add a tiling layout in your config module:

```ts
import LayoutTiling from "@bond-wm/layout-tiling";

const config: IConfig = {
  // ...

  /** Layouts available to cycle through. */
  layouts: [LayoutTiling],
};
```
