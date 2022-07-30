# electron-wm

<img align="right" src="/assets/logo.svg" height="110px" alt="electron-wm logo">

An X Window Manager built on web technologies, including Electron and React.

<br /><br /><br />

## Screenshot

![electron-wm screenshot](assets/screenshots/1.png?raw=true)

## Development

To do prerequisite build steps:

    npm run build

To start a test X server (requires Xephyr):

    npm run startx

To start the window manager:

    npm run start

## Usage

The window manager is stable enough for basic daily usage.

At this time, there is no distributed release. To try out the window manager, check out this repository, built it, and invoke `electron` against the repository root directory.

```
Command line flags:
  --console-logging  Enable console log output        [boolean] [default: false]
  --file-logging     Enable logging output to a file
  --help
```

For example, you may want to create an `.xinitrc` and run something like the following at the end:

```
exec /path/to/electron-wm-checkout/.bin/electron /path/to/electron-wm-checkout
```

Make sure to run `npm run build` before attempting to use the window manager from the source checkout.

### Configuration

A basic config file is read from the following locations:

- `app-path/.ewmrc.js`
    - The file distributed with the application.
- `$XDG_CONFIG_HOME/electron-wm-config/.ewmrc.js`
    - Typically `$HOME/.config/electron-wm-config/.ewmrc.js`

See the `.ewmrc.js` example included in this repository.

Possible locations are probed in the order listed above. If config files are found in each location, the values set by later config files override those from prior config files.

### Keyboard Shortcuts

The following shortcuts are supported:

(`Mod4` is typically the Windows key.)

| Shortcut      | Description |
| ------------- | ----------- |
| `Mod4 + Enter` | Opens a new instance of your configured default terminal. |
| `Mod4 + Space` | Swaps between available layouts on the current screen. |
| `Mod4 + R` | Opens a basic run prompt in the desktop, where you can type a command like `firefox` |
| `Mod4 + O` | Sends the active window to the next screen. |
| `Mod4 + 1` ... `Mod4 + 9` | Switches to a different tag by index. |
| `Mod4 + Shift + 1` ... `Mod4 + Shift + 9` | Sends the active window to a different tag by index. |
| `Mod4 + Shift + C` | Closes the focused window. |
| `Mod4 + Shift + Q` | Closes the window manager |
| `Mod4 + Ctrl + R` | Reloads the window manager |

Shortcuts are currently hard-coded in the wm.ts.

## License

[MIT License](LICENSE.md)
