# @electron-wm/react-frame

A React-based window frame implementation for electron-wm.

## Usage

In your electron-wm config module, pass this module as the frame implementation to use:

```ts
import * as ReactFrame from "@electron-wm/react-frame";

export default {
  // ...

  /** Window frame configuration. */
  frame: {
    module: ReactFrame,
    settings: {
      // This `Frame` React component is defined elsewhere in your config module,
      // not in this react-frame package.
      frameComponent: Frame,
    },
  },
};
```

Specifying `module: ReactFrame` above tells electron-wm to use a React-based window frame.
The `frameComponent` is where you actually plug in your customized frame. (The `ReactFrame`
will basically take your `frameComponent` and insert it into the React root that it
establishes.)
