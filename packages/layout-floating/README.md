# @electron-wm/layout-floating

A default floating layout for the `electron-wm` window manager.

## Usage

Import and add floating layouts in your config module:

```ts
import { createFloatingLayout } from "@electron-wm/layout-floating";

const config: IConfig = {
  // ...

  /** Layouts available to cycle through. */
  layouts: [createFloatingLayout({ floatRight: false })],
};
```

## Configuration

- `floatRight`: If true, windows start on the right side of the screen.
