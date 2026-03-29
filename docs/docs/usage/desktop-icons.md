---
sidebar_position: 2
---

# Desktop Icons and App Launching

bond-wm reads `.desktop` entries in two different ways:

- desktop icon entries (for `<DesktopEntries />`)
- application entries (for launcher/start menu UIs such as `<StartMenuApplicationList />`)

## How do I control whether desktop icons appear?

With the React configuration, desktop icons are displayed if you render the
`<DesktopEntries />` component.

## Where do desktop icons come from?

Desktop icons are read from your XDG Desktop directory (`xdg-user-dir DESKTOP`),
usually `~/Desktop`.

If you want an app to appear as a desktop icon, copy or create a `.desktop`
file in that folder.

## Where do launcher/start menu apps come from?

Application entry metadata is read from standard application folders, including:

- `/usr/share/applications`
- `/usr/local/share/applications`
- `~/.local/share/applications`

So start menu entries can appear even when no icon file exists in `~/Desktop`.

## What fields are supported?

bond-wm aims for freedesktop desktop entry compatibility, with these currently
supported fields:

- `NoDisplay=true` or `Hidden=true`: suppress entry
- `Name`: display label
- `Type`: `Application` or `Link`
- `Icon`: icon name or absolute path (SVG/PNG)

For `Type=Application`:

- `Exec`: command to launch
- `Path`: working directory (when provided)
- `Categories`: used for start menu grouping

For `Type=Link`:

- `URL`: link target

## Example

```ini
[Desktop Entry]
Type=Application
Name=My Terminal
Exec=kitty
Icon=utilities-terminal
Categories=System;
```

## Notes

- `%u`, `%U`, `%f`, `%F`, `%i`, `%c`, and `%k` placeholders in `Exec` are
  stripped before launch.
- Directory entries are currently not shown.
- For more freedesktop background, see
  [desktop entries](https://wiki.archlinux.org/title/desktop_entries).
