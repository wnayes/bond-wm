# electron-wm

<img align="right" src="/assets/logo.svg" height="110px" alt="electron-wm logo">

An X Window Manager built on web technologies, including Electron and React.

This project is still in a prototype state. Basic window manager functionality is coming together, but lacks polish.

## Development

To do prerequisite build steps:

    npm run build

To start a test X server (requires Xephyr):

    npm run startx

To start the window manager:

    npm run start

## Usage

```
electron-wm window manager

Options:
  --console-logging  Enable console log output        [boolean] [default: false]
  --file-logging     Enable logging output to a file
  --help
```

## License

[MIT License](LICENSE.md)
