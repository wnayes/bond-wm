---
sidebar_position: 2
---

# Desktop Icons

Support for displaying desktop entries (icons) is built-in.

## How do I control whether desktop icons appear?

With the React configuration, desktop icons are displayed if you render the
`<DesktopEntries />` component.

## How do I specify which icons appear?

The window manager looks for `.desktop` files in your XDG Desktop user
directory. This is usually `$HOME/Desktop` (`~/Desktop`) but is configurable [as
described here](https://wiki.archlinux.org/title/XDG_user_directories).

Normally, installed packages create `.desktop` files in a system folder; they
aren't usually put into your XDG Desktop directory. This means that you should
copy the `.desktop` files that you actually want to appear into your XDG Desktop
directory to get them to appear in the window manager.

The Arch Linux wiki [mentions](https://wiki.archlinux.org/title/desktop_entries#Application_entry)
some common locations for `.desktop` files, but it may vary.

## What goes in a `.desktop` file?

The intention is to support [standard desktop files](https://wiki.archlinux.org/title/desktop_entries),
but here are some notes about what is supported currently:

### Supported properties

- `NoDisplay` and `Hidden` suppress the display of a `.desktop` file.
- `Name`: The desktop icon caption
- `Type`: "Application" or "Link"
- `Icon`: SVG or PNG icon

For type Application:

- `Exec`: Application to launch
- `Path`: Working directory when launching the application

For type Link:

- `URL`: URL to open
