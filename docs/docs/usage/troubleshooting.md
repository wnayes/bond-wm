---
sidebar_position: 5
---

# Troubleshooting

## bond-wm fails to start with default config path error

Symptom:

- Error like: no config specified and no default config location exists.

Checks:

- ensure `${XDG_CONFIG_HOME}/bond-wm-config` exists
- or pass explicit `--config <path>`
- verify your path contains a valid config package export

## `--config` package name fails to resolve

If using package identifiers (for example `@bond-wm/react-config`), make sure:

- package is installed and resolvable by Node
- you are launching from an environment where Node module resolution can find it

## Keyboard shortcut does not fire

Checks:

- key string matches expected case (especially when using `Shift`)
- key names are valid keysym names
- shortcut does not conflict with something else in your environment

## Desktop icons not showing

Checks:

- `.desktop` files are in your XDG desktop folder (`xdg-user-dir DESKTOP`)
- entries are not marked `NoDisplay=true` or `Hidden=true`
- files contain required fields (`Name`, `Type`, etc.)

See [Desktop Icons and App Launching](./desktop-icons).

## Start menu app list is empty

Checks:

- app `.desktop` files exist in app directories such as:
  `/usr/share/applications` or `/usr/local/share/applications`
- your entries include supported fields (`Name`, `Exec`, `Type=Application`)

## Transparency / rounded corners do not look right

Use a compositor such as `picom`, started before `bond-wm`.

```bash
picom &
exec bond-wm
```

If visuals look too heavy, tune or disable picom defaults like shadows/fading.

## Need deeper diagnostics

Run with logging enabled:

```bash
bond-wm --console-logging --file-logging /tmp/bond-wm.log
```

Then inspect `/tmp/bond-wm.log` for startup/config/shortcut/window events.
