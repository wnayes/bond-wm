# electron-wm

<img align="right" src="/assets/logo.svg" height="110px" alt="electron-wm logo">

An X Window Manager built on web technologies, including Electron and React.

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

At this time, there is no distributed releases. To try out the window manager, check out this repository, built it, and invoke `electron` against the repository root directory.

```
Command line flags:
  --console-logging  Enable console log output        [boolean] [default: false]
  --file-logging     Enable logging output to a file
  --help
```

## Configuration

A basic config file is read from the following locations:

- `$XDG_CONFIG_HOME/electron-wm-config/.ewmrc.js`
    - (Typically `$HOME/.config/electron-wm-config/.ewmrc.js`)

See the `.ewmrc.js` example included in this repository.

## License

[MIT License](LICENSE.md)
