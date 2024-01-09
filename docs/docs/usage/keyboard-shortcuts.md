---
sidebar_position: 1
---

# Keyboard Shortcuts

Keyboard shortcuts are configured from your main configuration file. Configuration
templates, such as the React template, will include key binding configuration
that can be edited or extended as desired.

## Default shortcuts

(`Mod4` is typically the Windows key.)

| Shortcut                                  | Description                                               |
| ----------------------------------------- | --------------------------------------------------------- |
| `Mod4 + Enter`                            | Opens a new instance of your configured default terminal. |
| `Mod4 + Space`                            | Swaps between available layouts on the current screen.    |
| `Mod4 + R`                                | Opens a launcher program of your choice.                  |
| `Mod4 + O`                                | Sends the active window to the next screen.               |
| `Mod4 + 1` ... `Mod4 + 9`                 | Switches to a different tag by index.                     |
| `Mod4 + Shift + 1` ... `Mod4 + Shift + 9` | Sends the active window to a different tag by index.      |
| `Mod4 + Shift + C`                        | Closes the focused window.                                |
| `Mod4 + Shift + Q`                        | Closes the window manager                                 |
| `Mod4 + Ctrl + R`                         | Reloads the window manager                                |

## Notes

- Shortcut registration uses [particular string values](https://www.npmjs.com/package/keysym?activeTab=code) that X11 understands.
- When using letters in a shortcut, you currently need to use lower/upper casing based on whether the shortcut uses Shift.
  - Examples: `Mod4 + r` and `Mod4 + Shift + R`
