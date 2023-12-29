---
sidebar_position: 3
---

# Running

After installation and configuration, you can run the window manager and try it
out.

As with other X11 window managers, it is common to edit your `.xinitrc`
file and add `electron-wm` to the end, making it the last executable invoked
when starting your X server.

If your configuration package is in a non-default location, specify it via the
`--config` command line parameter.

```
electron-wm --config ~/my-desktop-config
```

If you omit `--config` it is assumed that your configuration resides in the
`electron-wm-config` folder that the init script creates by default.

Note that `--config` doesn't have to refer to a local folder. This can be any
"package identifier" that Node.js can `require` at runtime, provided you have
installed the package. For example, if you want the vanilla react template that
electron-wm provides, you could `npm i -g @electron-wm/react-config` and then
pass `--config @electron-wm/react-config`.

## Transparency

If you want to have rounded frame window edges with transparency, try using an
X11 compositor. The [picom](https://github.com/yshui/picom) compositor has been
found to work well.

As typical with X11 compositors, they are often ran before the WM itself:

```
picom &
exec electron-wm
```

Picom enables several effects by default (shadows, fading) which you may want to
disable via picom.conf.
