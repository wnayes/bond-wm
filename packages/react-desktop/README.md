# @electron-wm/react-desktop

A React-based desktop implementation for electron-wm.

## Usage

In your electron-wm desktop config module, pass this module as the desktop implementation to use:

```ts
import * as ReactDesktop from "@electron-wm/react-desktop";

/** Desktop configuration. */
export default {
  module: ReactDesktop,
  settings: {
    desktopComponent: MyDesktop,
  },
};
```

Specifying `module: ReactDesktop` above tells electron-wm to use a React-based desktop.
The `desktopComponent` is where you actually plug in your customized desktop. (The `ReactDesktop`
will basically take your `desktopComponent` and insert it into the React root that it
establishes.)
