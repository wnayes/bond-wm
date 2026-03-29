---
sidebar_position: 4
---

# CLI and Runtime Flags

Use `bond-wm --help` to list current options.

## Flags

### `--config <value>`

Config location to load.

`value` can be:

- absolute path to config package directory
- relative path (resolved from current working directory)
- package specifier resolvable by Node.js (for example `@bond-wm/react-config`)

If omitted, bond-wm defaults to `${XDG_CONFIG_HOME}/bond-wm-config`.

### `--console-logging`

Enables WM logging to stdout/stderr.

### `--file-logging <path>`

Writes WM logs to a file at `<path>`.

Current behavior uses file mode `w` (overwrite on start), not append.

## Common Examples

```bash
bond-wm --config ~/.config/bond-wm-config
bond-wm --config @bond-wm/react-config
bond-wm --console-logging
bond-wm --console-logging --file-logging /tmp/bond-wm.log
```

## Startup in `.xinitrc`

```bash
picom &
exec bond-wm --config ~/.config/bond-wm-config
```

## Dev-Time Desktop Shortcuts

In desktop renderer windows:

- `F12`: desktop developer tools
- `Ctrl + =`: zoom in
- `Ctrl + -`: zoom out
- `Ctrl + 0`: zoom reset
