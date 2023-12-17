---
sidebar_position: 1
---

# Installation

To use the window manager, it needs be installed on your machine.

## Global Installation

Run the following to globally install electron-wm and make it executable via `electron-wm` from any terminal.

```
npm install -g electron-wm
```

## Local Installation

You don't _have to_ globally install the package. In any folder with a
package.json, you can `npm install` the `electron-wm` package into a local
`node_modules` folder.

The caveat here is that you can't just execute
`electron-wm` from anywhere; you'd have to invoke it from inside the local
`node_modules` folder. Any other places in the docs that refer to executing
`electron-wm` will need to be adjusted to account for this.
