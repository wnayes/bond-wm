---
sidebar_position: 3
---

# Running

After installation and configuration, you can run the window manager and try it
out.

As with other X11 window managers, you probably want to edit your `.xinitrc` file
and add `electron-wm` to the end, making it the last executable invoked when
starting your X server.

If your configuration package is in a non-default location, specify it via the
`--config` command line parameter.

```
electron-wm --config ~/my-desktop-config
```

If you omit `--config` it is assumed that your configuration resides in the
default `electron-wm-config` folder that the init script creates.

Note that `--config` doesn't have to refer to a local folder. This can be any
"package identifier" that Node.js can `require` at runtime, provided you have
installed the package. For example, if you want the vanilla react template that
electron-wm provides, you could `npm i -g @electron-wm/react-config` and then
pass `--config @electron-wm/react-config`.
